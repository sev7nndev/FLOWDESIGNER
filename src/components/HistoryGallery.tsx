import React from 'react';
import { GeneratedImage } from '../types';
import { Download, Clock } from 'lucide-react';
import { Button } from './Button';

interface HistoryGalleryProps {
    history: GeneratedImage[];
    downloadImage: (url: string, filename: string) => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, downloadImage }) => {
    if (history.length === 0) {
        return (
            <div className="text-center py-10 text-zinc-500">
                <Clock size={32} className="mx-auto mb-3" />
                <p>Seu histórico está vazio.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((item) => (
                <div key={item.id} className="relative group aspect-[16/9] rounded-lg overflow-hidden border border-zinc-700 hover:border-primary transition-colors bg-zinc-800">
                    <img 
                        src={item.url} 
                        alt={`History item ${item.id}`} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-xs text-zinc-400 truncate mb-1">{item.prompt.substring(0, 50)}...</p>
                        <div className="flex gap-2">
                            <Button 
                                variant="primary" 
                                size="small" 
                                onClick={() => downloadImage(item.url, `flow-design-${item.id}.png`)}
                                icon={<Download size={14} />}
                                className="flex-grow"
                            >
                                Baixar
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};