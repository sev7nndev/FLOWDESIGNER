import React, { useState } from 'react';
import { GeneratedImage, GenerationStatus } from '../types';
import { ImageResult } from './ImageResult';
// FIX: Removed missing import (Error 18)
import { History, Sparkles, Loader2 } from 'lucide-react';

interface GenerationHistoryProps {
    currentImage: GeneratedImage | null;
    history: GeneratedImage[];
    status: GenerationStatus;
    error: string | undefined;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({ currentImage, history, status, error }) => {
    const [showHistory, setShowHistory] = useState(false);

    const imagesToDisplay = showHistory ? history : (currentImage ? [currentImage] : []);
    const isLoading = status === GenerationStatus.GENERATING;

    return (
        <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl shadow-xl border border-white/10 space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles size={24} className="text-secondary" /> 
                    {showHistory ? 'Histórico de Artes' : 'Resultado Atual'}
                </h2>
                <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-primary hover:text-secondary transition-colors flex items-center gap-1"
                >
                    <History size={16} />
                    {showHistory ? 'Ver Resultado Atual' : `Ver Histórico (${history.length})`}
                </button>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
                    <Loader2 size={32} className="animate-spin text-primary mb-4" />
                    <p className="text-lg">A IA está trabalhando...</p>
                    <p className="text-sm mt-1">Isso pode levar alguns segundos.</p>
                </div>
            )}

            {!isLoading && imagesToDisplay.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
                    <Sparkles size={32} className="mb-4" />
                    <p className="text-lg">Nenhuma arte gerada ainda.</p>
                    <p className="text-sm mt-1">Use o formulário ao lado para começar.</p>
                </div>
            )}

            {!isLoading && error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                    <p className="font-semibold">Erro na Geração:</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4">
                {imagesToDisplay.map((image) => (
                    <ImageResult key={image.id} image={image} />
                ))}
            </div>
        </div>
    );
};