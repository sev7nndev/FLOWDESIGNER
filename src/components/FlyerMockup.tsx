import React, { memo } from 'react';

export interface FlyerMockupProps {
  bg: string;
  title: string;
  priority?: boolean;
}

const FlyerMockupComponent: React.FC<FlyerMockupProps> = ({ bg, title, priority = false }) => {
  return (
    <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800 bg-white transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-primary/50" style={{ willChange: 'transform' }}>
      <img
        src={bg}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="w-full h-full object-contain"
        alt={title}
        style={{ willChange: 'auto' }}
      />
    </div>
  );
};

export const FlyerMockup = memo(FlyerMockupComponent);