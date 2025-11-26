import React from 'react';
import { Button } from './Button';
import { ChevronRight } from 'lucide-react';
import { SparklesCore } from './Sparkles';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <div className="relative w-full flex flex-col items-center justify-center pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          id="tsparticles-hero"
          background="transparent"
          minSize={0.4}
          maxSize={1.2}
          particleDensity={60}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={0.5}
        />
      </div>
      <div className="absolute top-0 z-0 h-64 w-[40rem] rounded-full bg-primary/40 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <h1 className="bg-gradient-to-br from-white to-gray-400 py-4 bg-clip-text text-5xl md:text-7xl font-bold tracking-tighter text-transparent leading-tight">
          Crie Artes Profissionais <br /> com Inteligência Artificial
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Sua agência de design particular. Gere flyers, posts e banners de nível de estúdio em segundos, sem precisar de um designer.
        </p>
        <div className="mt-8">
          <Button 
            onClick={onGetStarted} 
            className="h-14 px-8 text-lg rounded-full shadow-[0_0_50px_-10px_rgba(139,92,246,0.6)] border border-white/20"
          >
            Começar Agora <ChevronRight className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};