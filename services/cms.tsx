import { ContentfulClientApi, createClient } from 'contentful';
import moment from 'moment';
import React from 'react';
import BittrexSVG from '../assets/svgs/bittrex-logo.svg';
import KucoinSVG from '../assets/svgs/kucoin-logo.svg';
import DiscordSVG from '../assets/svgs/socials/brand-discord.svg';
import RedditSVG from '../assets/svgs/socials/brand-reddit.svg';
import TelegramSVG from '../assets/svgs/socials/brand-telegram.svg';
import { Button } from '../components/Button';
import { CMS } from '../constants';
import { SideMenuItem, TPages } from '../state/navigation';
import {
  IAuthor,
  IFigureImage,
  IPost,
  ISplitPage,
  IFAQItem,
} from '../types/cms';

interface IFetchBlogEntriesReturn {
  posts: Array<IPost>;
  total: number;
}

interface IFetchFAQItemsReturn {
  faqItems: Array<IFAQItem>;
  total: number;
}

// Turns CMS IDs into slugs
export const slugify = (id: string) => id?.replace(/_/g, '-').toLowerCase();
export const unslugify = (slug: string) =>
  slug.replace(/-/g, '_').toUpperCase();

export class CmsApi {
  client: ContentfulClientApi;

  constructor() {
    this.client = createClient({
      space: process.env.CONTENTFUL_SPACE_ID,
      accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
    });
  }

  public async fetchBlogEntries(
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<IFetchBlogEntriesReturn> {
    const entries = await this.client.getEntries({
      content_type: 'post', // only fetch blog post entry
      order: '-fields.date',
      limit: quantity,
      skip: (page - 1) * quantity,
    });

    if (entries && entries.items && entries.items.length > 0) {
      const blogPosts = entries.items.map(entry => this.convertPost(entry));
      return { posts: blogPosts, total: entries.total };
    }

    return { posts: [], total: 0 } as IFetchBlogEntriesReturn;
  }

  public async fetchBlogById(id): Promise<IPost> {
    return this.client.getEntry(id).then(entry => {
      if (entry) {
        return this.convertPost(entry);
      }
      return null;
    });
  }

  public async fetchBlogBySlug(slug: string): Promise<IPost> {
    const entries = await this.client.getEntries({
      content_type: 'post',
      'fields.slug': slug,
    });

    if (entries?.items?.length > 0) {
      const post = this.convertPost(entries.items[0]);
      return post;
    }

    return null;
  }

  public async fetchBlogEntriesByTag(
    tag: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE_TAGGED,
    page = 1,
  ): Promise<IFetchBlogEntriesReturn> {
    const entries = await this.client.getEntries({
      content_type: 'post',
      order: '-fields.date',
      'fields.tags[in]': tag,
      limit: quantity,
      skip: (page - 1) * quantity,
    });

    if (entries?.items?.length > 0) {
      const posts = entries.items.map(entry => this.convertPost(entry));
      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as IFetchBlogEntriesReturn;
  }

  public async fetchBlogEntriesWithoutDevUpdates(
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<IFetchBlogEntriesReturn> {
    const DEV_UPDATE_TAG = 'dev-update';
    const entries = await this.client.getEntries({
      content_type: 'post', // only fetch blog post entry
      order: '-fields.date',
      'fields.tags[ne]': DEV_UPDATE_TAG, // Exclude blog posts with the "dev-update" tag
      limit: quantity,
      skip: (page - 1) * quantity,
    });

    if (entries && entries.items && entries.items.length > 0) {
      const blogPosts = entries.items.map(entry => this.convertPost(entry));
      return { posts: blogPosts, total: entries.total };
    }

    return { posts: [], total: 0 } as IFetchBlogEntriesReturn;
  }

  public async fetchPageEntries(): Promise<TPages> {
    try {
      const entries = await this.client.getEntries({
        content_type: 'splitPage', // only fetch blog post entry
        order: 'fields.order',
      });

      if (entries && entries.items && entries.items.length > 0) {
        const pagesArray = entries.items.map(entry => this.convertPage(entry));

        const pages: TPages = {};
        pagesArray.forEach(page => {
          const pageExists = SideMenuItem[page.id];

          if (pageExists) {
            pages[page.id] = page;
          }
        });

        return pages;
      }
    } catch (e) {
      return {};
    }
  }

  public async fetchPageById(id: SideMenuItem): Promise<ISplitPage> {
    return this.client
      .getEntries({
        content_type: 'splitPage',
        'fields.id[in]': id,
      })
      .then(entries => {
        if (entries && entries.items && entries.items.length > 0) {
          return this.convertPage(entries.items[0]);
        }
        return null;
      });
  }

  public async fetchFAQItems(): Promise<IFetchFAQItemsReturn> {
    const entries = await this.client.getEntries({
      content_type: 'faq_item', // only fetch faq items
      order: 'fields.id',
    });

    if (entries && entries.items && entries.items.length > 0) {
      const faqItems = entries.items.map(entry => this.convertFAQ(entry));
      return { faqItems, total: entries.total };
    }

    return { faqItems: [], total: 0 } as IFetchFAQItemsReturn;
  }

  public convertImage = (rawImage): IFigureImage =>
    rawImage
      ? {
          imageUrl: rawImage.file.url.replace('//', 'https://'), // may need to put null check as well here
          description: rawImage.description ?? null,
          title: rawImage.title ?? null,
        }
      : null;

  public convertAuthor = (rawAuthor): IAuthor =>
    rawAuthor
      ? {
          name: rawAuthor?.name ?? null,
          avatar: this.convertImage(rawAuthor.avatar.fields),
          shortBio: rawAuthor?.shortBio ?? null,
          position: rawAuthor?.position ?? null,
          email: rawAuthor?.email ?? null,
          twitter: rawAuthor?.twitter ?? null,
          facebook: rawAuthor.facebook ?? null,
          github: rawAuthor.github ?? null,
        }
      : null;

  public convertPost = (rawData): IPost => {
    const rawPost = rawData.fields;
    const rawFeatureImage = rawPost?.featureImage
      ? rawPost?.featureImage.fields
      : null;
    const rawAuthor = rawPost.author ? rawPost.author.fields : null;

    return {
      id: rawData.sys.id ?? null,
      body: rawPost.body ?? null,
      subtitle: rawPost.subtitle ?? null,
      description: rawPost.description ?? null,
      publishedDate: moment(rawPost.date).format('DD MMMM YYYY'),
      slug: rawPost.slug,
      tags: rawPost?.tags, //?.map(t => t?.fields?.label) ?? [],
      title: rawPost.title,
      featureImage: this.convertImage(rawFeatureImage),
      author: this.convertAuthor(rawAuthor),
    };
  };

  public convertPage = (rawData): ISplitPage => {
    const rawPage = rawData.fields;
    const rawHero = rawPage?.hero ? rawPage?.hero?.fields : null;

    return {
      id: SideMenuItem[rawPage?.id] ?? null,
      label: rawPage?.label ?? null,
      title: rawPage?.title ?? null,
      body: rawPage?.body ?? null,
      hero: this.convertImage(rawHero),
    };
  };

  public convertFAQ = (rawData): IFAQItem => {
    const rawFAQ = rawData.fields;
    const { question, answer, id } = rawFAQ;

    return {
      id: id ?? null,
      question: question ?? null,
      answer: answer ?? null,
    };
  };
}

const extractShortcodeGeneralButton = (shortcode: string) => {
  if (!CMS.SHORTCODES.GENERAL_BUTTON.test(shortcode)) {
    return null;
  }

  // Pull our href and text
  const href = shortcode
    .replace(/^{{[\s]*button[\s]*href="/, '')
    .replace(/"[\s]*text="[^"]{1,99}"[\s]*}}/, '');

  const text = shortcode
    .replace(/^{{[\s]*button[\s]*href="[^"]{1,333}"[\s]*text="/, '')
    .replace(/"[\s]*}}$/, '');

  return { href, text };
};

export const renderShortcode = (shortcode: string) => {
  // General button
  if (CMS.SHORTCODES.GENERAL_BUTTON.test(shortcode)) {
    const { href, text } = extractShortcodeGeneralButton(shortcode);
    return (
      <div className="flex justify-center mt-2 mb-4">
        <Button onClick={() => open(href, '_blank')}>{text}</Button>
      </div>
    );
  }

  // Community links
  if (CMS.SHORTCODES.COMMUNITY_LINKS.test(shortcode)) {
    // Community links - Telegram, Discord, Reddit, etc
    return (
      <div className="flex justify-center mt-6 mb-4 space-x-4">
        <RedditSVG
          className="h-8 cursor-pointer"
          onClick={() => open('https://www.reddit.com/r/oxen_io', '_blank')}
        />
        <TelegramSVG
          className="h-8 cursor-pointer"
          onClick={() => open('https://t.me/Oxen_Community', '_blank')}
        />
        <DiscordSVG
          className="h-8 cursor-pointer"
          onClick={() => open('https://discord.com/invite/67GXfD6', '_blank')}
        />
      </div>
    );
  }

  // Trade links on "Why buy $OXEN?"
  if (CMS.SHORTCODES.TRADE_LINKS.test(shortcode)) {
    return (
      <div className="flex flex-col items-center mt-6 space-y-4">
        <h4 className="text-lg font-bold tracking-wide">Find $OXEN on</h4>
        <div className="flex justify-center mb-4 space-x-4">
          <Button
            wide
            prefix={<KucoinSVG className="h-4" />}
            onClick={() => open('https://trade.kucoin.com/LOKI-USDT', '_blank')}
            type="ghost"
          >
            Kucoin
          </Button>
          <Button
            wide
            prefix={<BittrexSVG className="h-4" />}
            onClick={() =>
              open(
                'https://global.bittrex.com/Market/Index?MarketName=USDT-OXEN',
                '_blank',
              )
            }
            type="ghost"
          >
            Bittrex
          </Button>
        </div>
      </div>
    );
  }

  // Github links
  if (CMS.SHORTCODES.GITHUB_LINKS.test(shortcode)) {
    // oxen core, session android/desktop/ios, lokinet
    return (
      <>
        <div className="flex flex-wrap justify-center mt-6 mb-4 space-x-4">
          <Button
            onClick={() =>
              open('https://github.com/oxen-io/oxen-core', '_blank')
            }
            type="ghost"
          >
            Oxen Core
          </Button>
          <Button
            onClick={() =>
              open('https://github.com/oxen-io/loki-network', '_blank')
            }
            type="ghost"
          >
            Lokinet
          </Button>
        </div>

        <div className="flex flex-wrap justify-center mb-4 space-x-4">
          <Button
            className="mb-4"
            onClick={() =>
              open('https://github.com/oxen-io/session-android', '_blank')
            }
            type="ghost"
          >
            Session Android
          </Button>
          <Button
            className="mb-4"
            onClick={() =>
              open('https://github.com/oxen-io/session-ios', '_blank')
            }
            type="ghost"
          >
            Session iOS
          </Button>
          <Button
            className="mb-4"
            onClick={() =>
              open('https://github.com/oxen-io/session-desktop', '_blank')
            }
            type="ghost"
          >
            Session Desktop
          </Button>
        </div>
      </>
    );
  }

  // Call to Action -> Who Uses Oxen
  if (CMS.SHORTCODES.CTA_WHO_USES_OXEN.test(shortcode)) {
    return (
      <div className="flex justify-center mt-6 mb-4 space-x-4">
        <Button
          onClick={() => open('https://getsession.org', '_blank')}
          type="ghost"
        >
          Get Session
        </Button>
        <Button
          onClick={() =>
            open(
              'https://docs.oxen.io/using-the-oxen-blockchain/overview',
              '_blank',
            )
          }
          type="ghost"
        >
          Use Oxen
        </Button>
      </div>
    );
  }

  // Call to Action -> Session & Lokinet
  if (CMS.SHORTCODES.CTA_SESSION_LOKINET.test(shortcode)) {
    return (
      <div className="flex justify-center mt-6 mb-4 space-x-4">
        <Button
          onClick={() => open('https://getsession.org', '_blank')}
          type="ghost"
        >
          Get Session
        </Button>
        <Button
          onClick={() => open('https://lokinet.org', '_blank')}
          type="ghost"
        >
          Use Lokinet
        </Button>
      </div>
    );
  }

  // All shortcode buttons with simple hrefs
  const shortcodeButton = Object.values(CMS.SHORTCODE_BUTTONS).find(item =>
    item.regex.test(shortcode),
  );

  if (shortcodeButton) {
    return (
      <div className="flex justify-center mb-4">
        <Button onClick={() => open(shortcodeButton.href, '_blank')}>
          {shortcodeButton.text}
        </Button>
      </div>
    );
  }

  return null;
};
