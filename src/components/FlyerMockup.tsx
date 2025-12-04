import React from 'react';

export interface FlyerMockupProps {
  bg: string;
  title: string;
}

export const FlyerMockup: React.FC<FlyerMockupProps> = ({ bg, title }) => {
  return (
    <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800 bg-zinc-900 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-primary/50 transform-gpu hover:rotate-1 hover:scale-[1.02]">
      <img
        src={bg}
        loading="lazy"
        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
        alt={title}
      />
    </div>
  );
};