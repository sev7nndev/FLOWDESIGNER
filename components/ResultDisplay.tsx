import React, { useRef, useEffect, memo } from 'react';
import { GeneratedImage, GenerationState, GenerationStatus } from '../types';
import { GalleryModal } from './Modals';
import { History, Sparkles, Loader2, RefreshCw, Copy, Share2, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AILoadingProgress } from './AILoadingProgress';

interface ResultDisplayProps {
    state: GenerationState;
    downloadImage: (image: GeneratedImage) => void;
    handleNewGeneration: () => void;
    handleCopyPrompt: (prompt: string) => void;
    handleShare: (image: GeneratedImage) => void;
}

const ResultDisplayComponent: React.FC<ResultDisplayProps> = ({ 
    state, 
    downloadImage, 
    handleNewGeneration,
    handleCopyPrompt,
    handleShare
}) => {
    const resultRef = useRef<HTMLDivElement>(null);
    const [showGallery, setShowGallery] = React.useState(false);

    const { status, currentImage, error, history } = state;

    useEffect(() => {
        if (status === GenerationStatus.SUCCESS && currentImage) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [status, currentImage]);

    const isGenerating = status === GenerationStatus.GENERATING;
    const isSuccess = status === GenerationStatus.SUCCESS && currentImage !== null;
    const isError = status === GenerationStatus.ERROR;
    const isIdle = status === GenerationStatus.IDLE;

    const handleDownloadFromGallery = (img: GeneratedImage) => {
        downloadImage(img);
    };

    const renderContent = () => {
        if (isGenerating) {
            return (
                <div className="animate-fade-in">
                    <AILoadingProgress />
                </div>
            );
        }

        if (isError) {
             return (
                <div className="flex flex-col items-center justify-center h-96 bg-red-900/50 rounded-3xl border border-red-700/50 p-8 text-center shadow-xl animate-fade-in">
                    <X size={48} className="text-red-500 mb-4" />
                    <p className="text-white font-medium mb-2">Ocorreu um erro na geração:</p>
                    <p className="text-red-300 text-sm mb-6">{error}</p>
                    
                    <Button variant="secondary" onClick={handleNewGeneration} className="text-sm" icon={<RefreshCw size={16} />}>
                        Tentar Novamente
                    </Button>
                </div>
            );
        }
        
        if (isSuccess) {
            return (
                <section className="animate-fade-in pt-4">
                    <div className="text-center mb-8">
                        <span className="text-primary text-xs font-bold uppercase tracking-widest mb-2 block">Resultado Final</span>
                        <h2 className="text-3xl font-bold text-white mb-2">Sua Arte Profissional</h2>
                    </div>
                    
                    {/* Imagem e Ações */}
                    <div className="group relative rounded-2xl overflow-hidden bg-surface border border-white/5 shadow-2xl max-w-[420px] mx-auto hover:shadow-[0_0_50px_rgba(139,92,246,0.3)] transition-shadow duration-500">
                        <div className="aspect-[3/4] w-full relative overflow-hidden bg-black/50">
                            <img 
                                src={currentImage.url} 
                                alt={currentImage.prompt} 
                                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                            />
                            
                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex gap-2 mb-4">
                                        <Button 
                                            onClick={() => downloadImage(currentImage)}
                                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors shadow-2xl shadow-primary/50 font-bold text-sm uppercase tracking-wider"
                                            icon={<Download size={18} />}
                                        >
                                            Baixar Flyer
                                        </Button>
                                        <Button 
                                            onClick={() => handleShare(currentImage)}
                                            variant="secondary"
                                            className="flex items-center gap-2 px-3 py-3 rounded-xl font-bold text-sm"
                                            icon={<Share2 size={18} />}
                                        >
                                            Compartilhar
                                        </Button>
                                    </div>
                                    <p className="text-gray-300 text-xs line-clamp-3 mb-2 font-light italic opacity-90 bg-black/30 p-2 rounded-lg">{currentImage.prompt}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-500 text-[10px] flex items-center gap-1 uppercase tracking-wider">
                                            <History size={10} />
                                            {new Date(currentImage.createdAt).toLocaleTimeString()}
                                        </p>
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => handleCopyPrompt(currentImage.prompt)} 
                                            className="text-xs px-2 py-1 h-auto text-gray-400 hover:text-white"
                                            icon={<Copy size={12} />}
                                        >
                                            Copiar Prompt
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Adicionando botão de histórico após o resultado */}
                    <div className="mt-6 text-center">
                        <Button variant="secondary" onClick={() => setShowGallery(true)} className="text-sm">
                            <History size={16} className="mr-2" /> Ver Histórico Completo ({history.length})
                        </Button>
                    </div>
                </section>
            );
        }

        // Initial Idle State
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-zinc-900/50 rounded-3xl border border-white/10 p-8 text-center shadow-xl">
                <Sparkles size={48} className="text-primary/50 mb-4" />
                <p className="text-gray-400 font-medium mb-6">Preencha os dados ao lado e clique em GERAR ARTE FLOW para começar.</p>
                
                {/* Botão de Histórico mais proeminente */}
                <Button 
                    variant="secondary" 
                    onClick={() => setShowGallery(true)} 
                    className="text-sm"
                    disabled={history.length === 0}
                >
                    <History size={16} className="mr-2" /> Ver Histórico ({history.length})
                </Button>
            </div>
        );
    };

    return (
        <div ref={resultRef} className="sticky top-20">
            {renderContent()}
            {showGallery && <GalleryModal history={history} onClose={() => setShowGallery(false)} onDownload={handleDownloadFromGallery} />}
        </div>
    );
};

export const ResultDisplay = memo(ResultDisplayComponent);