
import React from 'react';

const StrategyIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75L21 7.5M3.75 7.5L21 15.75M8.25 12h7.5" />
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5 7.5-3.358 7.5-7.5S16.142 4.5 12 4.5z" />
</svg>
);
export default StrategyIcon;
    