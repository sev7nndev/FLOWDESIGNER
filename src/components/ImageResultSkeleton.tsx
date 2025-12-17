import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Palette, Zap, LayoutTemplate, PenTool } from 'lucide-react';

const LOADING_STEPS = [
  { text: "Analisando seu briefing...", icon: <PenTool size={20} /> },
  { text: "Selecionando paleta de cores...", icon: <Palette size={20} /> },
  { text: "Estruturando layout comercial...", icon: <LayoutTemplate size={20} /> },
  { text: "Aplicando estilo visual...", icon: <Sparkles size={20} /> },
  { text: "Renderizando detalhes em 8K...", icon: <Zap size={20} /> },
  { text: "Finalizando sua arte...", icon: <Loader2 size={20} className="animate-spin" /> }
];

export const ImageResultSkeleton: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Cycle through steps every 2.5 seconds
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const step = LOADING_STEPS[currentStep];

  return (
    <div className="max-w-[320px] mx-auto animate-fade-in relative">

      {/* Container Principal com Efeito de Vidro */}
      <div className="relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl backdrop-blur-sm">

        {/* Glow de Fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 animate-pulse" />

        {/* Aspect Ratio 9:16 Placeholder */}
        <div className="aspect-[9/16] w-full flex flex-col items-center justify-center p-8 relative">

          {/* Círculo Central Animado */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse scale-150" />
            <div className="relative bg-surface border border-white/10 p-6 rounded-full shadow-lg">
              <div className="text-primary animate-bounce">
                {step.icon}
              </div>
            </div>
          </div>

          {/* Texto de Status Dinâmico */}
          <div className="text-center z-10 space-y-3">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <Sparkles size={18} className="text-yellow-400 fill-yellow-400" />
              Criando Arte...
            </h3>

            <div className="h-8 flex items-center justify-center">
              <p className="text-gray-300 text-sm font-medium animate-fade-in key={currentStep}">
                {step.text}
              </p>
            </div>
          </div>

          {/* Barra de Progresso Infinita */}
          <div className="w-48 mt-8 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent w-full -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>

        </div>
      </div>

      {/* Dica Flutuante */}
      <div className="mt-6 text-center animate-fade-in delay-700">
        <p className="text-zinc-500 text-xs flex items-center justify-center gap-2">
          <Loader2 size={12} className="animate-spin" />
          A IA está trabalhando. Não feche a aba.
        </p>
      </div>
    </div>
  );
};