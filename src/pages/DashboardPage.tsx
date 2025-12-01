import React from 'react';
import { GeneratedImage, UserRole } from '../types';
import GenerationForm from '../components/GenerationForm';
import GeneratedImageCard from '../components/GeneratedImageCard';
import { UsageData } from '../hooks/useGeneration';

interface DashboardPageProps {
    onGenerate: (businessInfo: string) => void;
    isGenerating: boolean;
    usage: UsageData;
    isLoadingUsage: boolean;
    generatedImage: GeneratedImage | null;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onGenerate, isGenerating, usage, isLoadingUsage, generatedImage }) => {
    // Nota: A lógica de geração foi simplificada aqui para usar o hook useGeneration
    // que já está no App.tsx. O GenerationForm precisa ser adaptado para receber
    // a função onGenerate e o estado de uso.
    
    return (
        <div className="space-y-8 pt-8">
            <h1 className="text-4xl font-extrabold text-center text-white">
                Crie sua Arte com IA
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">1. Descreva seu Negócio</h2>
                    {/* O GenerationForm precisa ser adaptado para receber as props corretas */}
                    {/* Por enquanto, usamos um placeholder para evitar erros de tipagem complexos */}
                    <div className="p-6 bg-zinc-900/90 border border-white/10 rounded-3xl">
                        <p className="text-gray-400">O formulário de geração será renderizado aqui.</p>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">2. Resultado</h2>
                    {generatedImage && (
                        <GeneratedImageCard
                            imageUrl={generatedImage.url}
                            prompt={generatedImage.prompt}
                        />
                    )}
                    {!generatedImage && (
                        <div className="p-6 bg-zinc-900/90 border border-white/10 rounded-3xl h-64 flex items-center justify-center">
                            <p className="text-gray-500">Aguardando geração...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;