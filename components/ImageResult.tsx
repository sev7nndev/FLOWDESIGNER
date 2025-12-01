import React from 'react';
import { GeneratedImage } from '../types';
import { Download, Info } from 'lucide-react';
import { Button } from './Button';

interface ImageResultProps {
    image: GeneratedImage;
    onDownload: (url: string, filename: string) => void; // FIX: Added missing prop (Error 3)
}

export const ImageResult: React.FC<ImageResultProps> = ({ image, onDownload }) => {
    const handleDownload = () => {
        const filename = `${image.businessInfo.companyName}_${image.id.substring(0, 8)}.png`;
        onDownload(image.url, filename);
    };

    return (
        <div className="bg-zinc-800 p-4 rounded-xl border border-white/10 shadow-lg flex flex-col">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-4 bg-black">
                <img 
                    src={image.url} 
                    alt={`Arte gerada para ${image.businessInfo.companyName}`} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/50 text-xs text-gray-400 px-2 py-1 rounded">
                    {new Date(image.createdAt).toLocaleDateString()}
                </div>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2 truncate">{image.businessInfo.companyName}</h3>
            
            <div className="text-xs text-gray-400 space-y-1 mb-4">
                <p className="flex items-start">
                    <Info size={14} className="flex-shrink-0 mr-2 mt-0.5" />
                    <span className="line-clamp-2">{image.businessInfo.details}</span>
                </p>
            </div>

            <Button 
                onClick={handleDownload} 
                variant="primary" 
                className="w-full mt-auto"
                icon={<Download size={18} />}
            >
                Baixar Imagem
            </Button>
        </div>
    );
};