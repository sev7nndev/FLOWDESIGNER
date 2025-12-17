import React, { useRef, useEffect, memo, useState } from 'react';
import { GeneratedImage, GenerationState, GenerationStatus } from '../../types';
import { ImageResult } from './ImageResult';
import { Sparkles, Download, Copy, History, Loader2, X, Share2 } from 'lucide-react';
import { Button } from './Button';
import { ImageResultSkeleton } from './ImageResultSkeleton';
import { cropImageToContent } from '../utils/imageCrop';
import { GalleryModal } from './Modals';

interface ResultDisplayProps {
    state: GenerationState;
    downloadImage: (image: GeneratedImage) => void;
    showGallery: boolean;
    setShowGallery: (show: boolean) => void;
    onDelete: (image: GeneratedImage) => void;
    isLoadingHistory?: boolean;
    loadHistory?: () => void;
}

const ResultDisplayComponent: React.FC<ResultDisplayProps> = ({ state, downloadImage, showGallery, setShowGallery, onDelete, isLoadingHistory, loadHistory }) => {
    const resultRef = useRef<HTMLDivElement>(null);
    const [showLightbox, setShowLightbox] = React.useState(false);

    // Download com crop (remove fundo)
    const handleDownloadWithCrop = async (image: GeneratedImage) => {
        try {
            const croppedImage = await cropImageToContent(image.url);
            const link = document.createElement('a');
            link.href = croppedImage;
            link.download = `flow-arte-${Date.now()}.png`;
            link.click();
        } catch (error) {
            console.error('Erro ao fazer crop:', error);
            // Fallback: download normal
            downloadImage(image);
        }
    };

    useEffect(() => {
        if (state.status === GenerationStatus.SUCCESS && state.currentImage) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [state.status, state.currentImage]);

    const renderContent = () => {
        if (state.status === GenerationStatus.GENERATING) {
            return <ImageResultSkeleton />;
        }

        if (state.currentImage) {
            return (
                <section className="animate-fade-in pt-4">
                    <div className="text-center mb-6">
                        <span className="text-primary text-xs font-bold uppercase tracking-widest mb-1 block">Resultado Final</span>
                        <h2 className="text-2xl font-bold text-white mb-2">Sua Arte Profissional</h2>
                    </div>
                    <div className="cursor-zoom-in group relative" onClick={() => setShowLightbox(true)} title="Clique para ampliar">
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center pointer-events-none">
                            <span className="opacity-0 group-hover:opacity-100 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm transition-opacity">Ampliar</span>
                        </div>
                        <ImageResult image={state.currentImage} onDownload={() => handleDownloadWithCrop(state.currentImage!)} />
                    </div>

                    {/* Lightbox Modal */}
                    {showLightbox && (
                        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowLightbox(false)}>
                            {/* Top Bar Actions */}
                            <div className="absolute top-4 right-4 flex gap-4 z-50">
                                <Button variant="primary" onClick={(e) => { e.stopPropagation(); handleDownloadWithCrop(state.currentImage!); }} className="shadow-xl">
                                    Baixar Imagem
                                </Button>
                                <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setShowLightbox(false); }} className="text-white hover:bg-white/10 rounded-full p-2">
                                    <X size={24} />
                                </Button>
                            </div>

                            <img
                                src={state.currentImage!.url}
                                alt={state.currentImage!.prompt}
                                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

                    {/* Adicionando botão de histórico após o resultado */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={async () => {
                                if (navigator.share) {
                                    try {
                                        // Create a file from the base64 image to share it effectively
                                        const response = await fetch(state.currentImage!.url);
                                        const blob = await response.blob();
                                        const file = new File([blob], 'flow-designer-art.png', { type: 'image/png' });

                                        await navigator.share({
                                            title: 'Minha Arte Flow Designer',
                                            text: 'Olha essa arte que criei com I.A. no Flow Designer!',
                                            files: [file]
                                        });
                                    } catch (err) {
                                        console.log('Error sharing:', err);
                                    }
                                } else {
                                    // Fallback to clipboard
                                    await navigator.clipboard.writeText(state.currentImage!.url);
                                    alert('Link da imagem copiado!');
                                }
                            }}
                            className="text-sm bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30"
                        >
                            <Share2 size={16} className="mr-2" /> Compartilhar
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => {
                                navigator.clipboard.writeText(state.currentImage?.prompt || '');
                                alert('Prompt copiado!');
                            }}
                            className="text-sm"
                        >
                            <Copy size={16} className="mr-2" /> Copiar Prompt
                        </Button>

                        <Button 
                            variant="secondary" 
                            onClick={() => {
                                if (!isLoadingHistory && state.history.length === 0) {
                                    loadHistory?.();
                                }
                                setShowGallery(true);
                            }} 
                            className="text-sm"
                            isLoading={isLoadingHistory}
                            disabled={isLoadingHistory}
                        >
                            <History size={16} className="mr-2" /> 
                            {isLoadingHistory ? 'Carregando...' : `Ver Histórico (${state.history.length})`}
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
            <button
              onClick={() => {
                if (state.history.length === 0 && !isLoadingHistory) {
                  loadHistory?.();
                }
                setShowGallery(true);
              }}
              disabled={isLoadingHistory}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-lg"
            >
              {isLoadingHistory ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Carregando Histórico...</span>
                </>
              ) : (
                <>
                  <History className="w-5 h-5" />
                  <span>Ver Histórico</span>
                </>
              )}
            </button>
            </div>
        );
    };

    return (
        <div ref={resultRef} className="sticky top-20">
            {renderContent()}
            {showGallery && <GalleryModal history={state.history} onClose={() => setShowGallery(false)} onDownload={downloadImage} onDelete={onDelete} isLoading={isLoadingHistory} />}
        </div>
    );
};

export const ResultDisplay = memo(ResultDisplayComponent);