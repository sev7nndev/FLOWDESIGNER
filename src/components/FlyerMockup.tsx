import React from 'react';

export interface FlyerMockupProps {
  bg: string;
  title: string;
  priority?: boolean;
}

export const FlyerMockup: React.FC<FlyerMockupProps> = ({ bg, title, priority = false }) => {
  return (
    <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800 bg-white transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-primary/50 transform-gpu hover:rotate-1 hover:scale-[1.02]">
      <img
        src={bg}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="w-full h-full object-contain transform transition-transform duration-700 group-hover:scale-110"
        alt={title}
      />
    </div>
  );
};