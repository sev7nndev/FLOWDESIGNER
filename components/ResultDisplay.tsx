import React, { useRef } from 'react';
import { GeneratedImage, GenerationState, GenerationStatus } from '../types';
import { ImageResult } from './ImageResult';
import { History, Sparkles, Loader2 } from 'lucide-react';

interface ResultDisplayProps {
    state: GenerationState;
    downloadImage: (url: string, filename: string) => void;
    showGallery: boolean; 
    setShowGallery: (show: boolean) => void; 
}

// Assuming the component is exported as ResultDisplay
const ResultDisplayComponent: React.FC<ResultDisplayProps> = ({ 
    state, 
    downloadImage, 
    // FIX: Removed unused 'showGallery' from destructuring (Error 5)
    setShowGallery 
}) => { 
    const resultRef = useRef<HTMLDivElement>(null);

    // Placeholder logic based on context
    const isLoading = state.status === GenerationStatus.GENERATING;
    const hasResult = state.currentImage !== null;

    return (
        <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl shadow-xl border border-white/10 space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles size={24} className="text-secondary" /> 
                    Resultado da Geração
                </h2>
                <button 
                    onClick={() => setShowGallery(true)}
                    className="text-sm text-primary hover:text-secondary transition-colors flex items-center gap-1"
                >
                    <History size={16} />
                    Ver Histórico
                </button>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
                    <Loader2 size={32} className="animate-spin text-primary mb-4" />
                    <p className="text-lg">A IA está trabalhando...</p>
                </div>
            )}

            {!isLoading && hasResult && state.currentImage && (
                <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4">
                    <ImageResult 
                        image={state.currentImage} 
                        onDownload={downloadImage}
                    />
                </div>
            )}

            {!isLoading && !hasResult && !state.error && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
                    <Sparkles size={32} className="mb-4" />
                    <p className="text-lg">Nenhuma arte gerada ainda.</p>
                </div>
            )}

            {!isLoading && state.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                    <p className="font-semibold">Erro na Geração:</p>
                    <p>{state.error}</p>
                </div>
            )}
        </div>
    );
};

export const ResultDisplay = ResultDisplayComponent;