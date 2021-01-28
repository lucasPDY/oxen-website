import React from 'react';
import { Landing } from '../../landing/Landing';
import { LandingSplit } from '../../landing/LandingSplit';

export function HomeLanding() {
  return (
    <Landing
      split
      background="linear-gradient(0deg, rgba(219,247,245,1) 0%, rgba(255,255,255,0) 100%)"
    >
      <LandingSplit
        title="Privacy should be simple."
        subtitle="good coins nd stuff"
      ></LandingSplit>

      <LandingSplit>
        <div
          style={{ width: '100%', paddingBottom: '100%' }}
          className="flex-grow h-0 bg-secondary rounded-full"
        ></div>
      </LandingSplit>
    </Landing>
  );
}
