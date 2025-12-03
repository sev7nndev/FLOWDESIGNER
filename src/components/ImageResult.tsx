import React from 'react';
import { GeneratedImage } from '@/types';
import { Download, Clock } from 'lucide-react';

interface ImageResultProps {
  image: GeneratedImage;
  onDownload: () => void;
}

export const ImageResult: React.FC<ImageResultProps> = ({ image, onDownload }) => {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-surface border border-white/5 shadow-2xl animate-fade-in max-w-[420px] mx-auto hover:shadow-[0_0_50px_rgba(139,92,246,0.3)] transition-shadow duration-500">
      {/* 3:4 Aspect Ratio Container */}
      <div className="aspect-[3/4] w-full relative overflow-hidden bg-black/50">
        <img 
          src={image.url} 
          alt={image.prompt} 
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-2 mb-4">
              <button 
                onClick={onDownload}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors shadow-2xl shadow-primary/50 font-bold text-sm uppercase tracking-wider"
              >
                <Download size={18} />
                Baixar Flyer
              </button>
            </div>
            {/* O React escapa o conteúdo de 'image.prompt' por padrão, prevenindo XSS. */}
            <p className="text-gray-300 text-xs line-clamp-3 mb-2 font-light italic opacity-90 bg-black/30 p-2 rounded-lg">{image.prompt}</p>
            <p className="text-gray-500 text-[10px] flex items-center gap-1 uppercase tracking-wider">
              <Clock size={10} />
              {new Date(image.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};