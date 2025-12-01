import React from 'react';
import { HoverBorderGradient } from './HoverBorderGradient'; // Importando o novo componente
import { ChevronRight } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <div className="relative w-full flex flex-col items-center justify-center pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
      {/* Background Effects - Simplified for performance */}
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
          <HoverBorderGradient 
            onClick={onGetStarted} 
            className="text-lg font-semibold px-6 py-3" // Ajustando o padding interno
            containerClassName="h-14 px-10 rounded-full"
            duration={3} 
          >
            Começar Agora <ChevronRight className="ml-2" />
          </HoverBorderGradient>
        </div>
      </div>
    </div>
  );
};