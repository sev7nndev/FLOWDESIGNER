import React from 'react';
import { Sparkles } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 flex-col gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-primary/20 p-3 rounded-xl border border-primary/20">
          <Sparkles size={24} className="text-primary animate-pulse" />
        </div>
        <span className="text-gray-500 text-sm">Carregando Flow Designer...</span>
      </div>
    </div>
  );
};