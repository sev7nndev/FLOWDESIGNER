import React from 'react';
import { UsageData } from '../hooks/useGeneration';

interface GenerationFormProps {
    onGenerate: (businessInfo: string) => void;
    isGenerating: boolean;
    usage: UsageData;
    isLoadingUsage: boolean;
}

const GenerationForm: React.FC<GenerationFormProps> = ({ onGenerate, isGenerating, usage, isLoadingUsage }) => {
    // Este é um placeholder. O GenerationForm completo está em components/GenerationForm.tsx
    // Mas o App.tsx espera que ele seja o componente principal do formulário.
    
    // Para resolver o erro de importação no App.tsx, criamos este arquivo.
    
    return (
        <div className="p-6 bg-zinc-900/90 border border-white/10 rounded-3xl">
            <h3 className="text-white font-bold mb-4">Formulário de Geração (Placeholder)</h3>
            <p className="text-gray-400 text-sm">
                O formulário completo de geração de imagens deve ser movido para cá ou este arquivo deve ser removido se o formulário for embutido no DashboardPage.
            </p>
            <p className="text-xs mt-2 text-primary">
                Uso: {isLoadingUsage ? 'Carregando...' : `${usage.current}/${usage.limit}`}
            </p>
        </div>
    );
};

export default GenerationForm;