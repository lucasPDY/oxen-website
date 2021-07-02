import React, { useState, useEffect } from 'react';

export function ReadingBar({ target }) {
  const [progress, setProgress] = useState(0);
  console.log('progress', progress);
  console.log(target);
  const scrollListener = () => {
    console.log('scrolling');
    if (!target.current) {
      return;
    }
    console.log(progress);
    const element = target.current;
    const totalHeight =
      element.clientHeight - element.offsetTop - window.innerHeight;
    console.log('total height', totalHeight);
    const windowScrollTop =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    console.log(
      window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0,
    );
    if (windowScrollTop === 0) {
      return setProgress(0);
    }

    if (windowScrollTop > totalHeight) {
      return setProgress(100);
    }

    setProgress((windowScrollTop / totalHeight) * 100);
  };

  useEffect(() => {
    window.addEventListener('scroll', scrollListener, true);
    console.log('add scroll listener');
    return () => window.removeEventListener('scroll', scrollListener);
  });

  return (
    <div className={`reading-progress-bar`} style={{ width: `${progress}%` }} />
  );
}
