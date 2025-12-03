import React, { useRef, useEffect, memo } from 'react';
import { GeneratedImage, GenerationState, GenerationStatus } from '../types';
import { ImageResult } from './ImageResult';
import { GalleryModal } from './Modals';
import { History, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ResultDisplayProps {
    state: GenerationState;
    downloadImage: (image: GeneratedImage) => void;
    showGallery: boolean;
    setShowGallery: (show: boolean) => void;
}

const ResultDisplayComponent: React.FC<ResultDisplayProps> = ({ state, downloadImage, showGallery, setShowGallery }) => {
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state.status === GenerationStatus.SUCCESS && state.currentImage) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [state.status, state.currentImage]);

    const renderContent = () => {
        if (state.status === GenerationStatus.GENERATING) {
            return (
                <div className="flex flex-col items-center justify-center h-96 bg-zinc-900/50 rounded-3xl border border-white/10 p-8 shadow-xl">
                    <Loader2 size={40} className="animate-spin text-primary mb-4" />
                    <p className="text-white font-medium text-lg">Gerando arte profissional...</p>
                    <p className="text-gray-500 text-sm mt-1">Isso pode levar até 30 segundos.</p>
                </div>
            );
        }

        if (state.currentImage) {
            return (
                <section className="animate-fade-in pt-4">
                    <div className="text-center mb-8">
                        <span className="text-primary text-xs font-bold uppercase tracking-widest mb-2 block">Resultado Final</span>
                        <h2 className="text-3xl font-bold text-white mb-2">Sua Arte Profissional</h2>
                    </div>
                    <ImageResult image={state.currentImage} onDownload={() => downloadImage(state.currentImage!)} />
                    
                    {/* Adicionando botão de histórico após o resultado */}
                    <div className="mt-6 text-center">
                        <Button variant="secondary" onClick={() => setShowGallery(true)} className="text-sm">
                            <History size={16} className="mr-2" /> Ver Histórico Completo ({state.history.length})
                        </Button>
                    </div>
                </section>
            );
        }

        // Initial Empty State
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-zinc-900/50 rounded-3xl border border-white/10 p-8 text-center shadow-xl">
                <Sparkles size={48} className="text-primary/50 mb-4" />
                <p className="text-gray-400 font-medium mb-6">Preencha os dados ao lado e clique em GERAR ARTE FLOW para começar.</p>
                
                {/* Botão de Histórico mais proeminente */}
                <Button variant="secondary" onClick={() => setShowGallery(true)} className="text-sm">
                    <History size={16} className="mr-2" /> Ver Histórico ({state.history.length})
                </Button>
            </div>
        );
    };

    return (
        <div ref={resultRef} className="sticky top-20">
            {renderContent()}
            {showGallery && <GalleryModal history={state.history} onClose={() => setShowGallery(false)} onDownload={downloadImage} />}
        </div>
    );
};

export const ResultDisplay = memo(ResultDisplayComponent);