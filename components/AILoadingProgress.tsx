import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, Image, CheckCircle2 } from 'lucide-react';

const LOADING_STEPS = [
    { 
        icon: Cpu, 
        message: "1. Analisando Briefing e Nicho de Mercado...", 
        duration: 5000 
    },
    { 
        icon: Sparkles, 
        message: "2. Engenharia de Prompt: Otimizando para Qualidade Profissional...", 
        duration: 10000 
    },
    { 
        icon: Image, 
        message: "3. Geração de Pixel: Criando a Arte Final (3:4 Vertical)...", 
        duration: 45000 
    },
    { 
        icon: CheckCircle2, 
        message: "4. Finalizando e Salvando no seu Histórico...", 
        duration: 5000 
    },
];

export const AILoadingProgress: React.FC = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const currentStep = LOADING_STEPS[currentStepIndex];
        if (!currentStep) return;

        // Animação de progresso dentro da etapa
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev < 100) {
                    return prev + 1;
                }
                return 100;
            });
        }, currentStep.duration / 100); // 100 ticks para 100%

        // Transição para a próxima etapa
        const timeout = setTimeout(() => {
            if (currentStepIndex < LOADING_STEPS.length - 1) {
                setCurrentStepIndex(prev => prev + 1);
                setProgress(0); // Reinicia o progresso para a próxima etapa
            }
        }, currentStep.duration);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [currentStepIndex]);

    const currentStep = LOADING_STEPS[currentStepIndex];

    return (
        <div className="p-6 bg-zinc-900 border border-primary/20 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center gap-4">
                <currentStep.icon size={24} className="text-primary animate-pulse" />
                <h3 className="text-lg font-semibold text-white">
                    {currentStep.message}
                </h3>
            </div>
            
            {/* Barra de Progresso Estilizada */}
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                <div 
                    className="h-2.5 bg-gradient-to-r from-primary to-secondary transition-all duration-100 ease-linear" 
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Exibição das Etapas */}
            <div className="space-y-2 pt-2">
                {LOADING_STEPS.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                        {index < currentStepIndex ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                        ) : index === currentStepIndex ? (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                        ) : (
                            <div className="h-3 w-3 rounded-full bg-gray-700" />
                        )}
                        <span className={index <= currentStepIndex ? 'text-white font-medium' : 'text-gray-500'}>
                            {step.message.split('. ')[1]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};