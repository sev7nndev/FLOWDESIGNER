import React from 'react';
import { GeneratedImage, GenerationStatus } from '../types';
import { Download, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface GenerationHistoryProps {
    currentImage: GeneratedImage | null;
    history: GeneratedImage[];
    status: GenerationStatus;
    error: string | null;
    downloadImage: (url: string, filename: string) => void;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
    currentImage,
    history,
    status,
    error,
    downloadImage,
}) => {
    const isLoading = status === 'loading';
    const displayImage = currentImage || history[0];

    return (
        <div className="space-y-8">
            {/* Seção de Visualização Principal */}
            <div className="bg-zinc-900 p-6 rounded-xl shadow-2xl border border-zinc-800">
                <h2 className="text-2xl font-bold text-white mb-4">Visualização do Fluxo</h2>
                
                <div className="relative w-full aspect-video bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                    {isLoading && (
                        <div className="flex flex-col items-center text-primary">
                            <Loader2 size={48} className="animate-spin mb-3" />
                            <p>Gerando seu fluxo de design...</p>
                        </div>
                    )}
                    
                    {error && !isLoading && (
                        <div className="flex flex-col items-center text-red-400 p-8 text-center">
                            <AlertTriangle size={48} className="mb-3" />
                            <p className="font-semibold">Erro na Geração:</p>
                            <p className="text-sm text-zinc-400">{error}</p>
                        </div>
                    )}

                    {displayImage && !isLoading && !error && (
                        <>
                            <img 
                                src={displayImage.url} 
                                alt="Generated Flow Design" 
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-4 right-4">
                                <Button 
                                    variant="secondary" 
                                    size="small" 
                                    onClick={() => downloadImage(displayImage.url, `flow-design-${displayImage.id}.png`)}
                                    icon={<Download size={16} />}
                                >
                                    Download
                                </Button>
                            </div>
                        </>
                    )}

                    {!displayImage && !isLoading && !error && (
                        <p className="text-zinc-500">Use o formulário ao lado para gerar seu primeiro fluxo de design.</p>
                    )}
                </div>
            </div>

            {/* Seção de Histórico */}
            {history.length > 0 && (
                <div className="bg-zinc-900 p-6 rounded-xl shadow-2xl border border-zinc-800">
                    <h2 className="text-xl font-bold text-white mb-4">Histórico Recente</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {history.map((item) => (
                            <div key={item.id} className="relative group cursor-pointer rounded-lg overflow-hidden border border-zinc-700 hover:border-primary transition-colors">
                                <img 
                                    src={item.url} 
                                    alt={`History item ${item.id}`} 
                                    className="w-full h-full object-cover aspect-square"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button 
                                        variant="primary" 
                                        size="small" 
                                        onClick={() => downloadImage(item.url, `flow-design-${item.id}.png`)}
                                        icon={<Download size={16} />}
                                    >
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};