import React from 'react';

export const ImageResultSkeleton: React.FC = () => {
  return (
    <div className="max-w-[420px] mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="h-4 bg-zinc-800 rounded-full w-1/3 mx-auto animate-pulse" />
        <div className="h-8 bg-zinc-800 rounded-full w-2/3 mx-auto mt-3 animate-pulse" />
      </div>
      <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
        <div className="aspect-[3/4] w-full bg-zinc-800 animate-pulse" />
      </div>
      <div className="mt-6 text-center">
        <div className="h-10 bg-zinc-800 rounded-full w-1/2 mx-auto animate-pulse" />
      </div>
    </div>
  );
};