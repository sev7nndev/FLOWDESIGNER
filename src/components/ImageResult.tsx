import React, { useState } from 'react';
import { GeneratedImage } from '@/types';
import { Download, Clock, Maximize } from 'lucide-react';
import { FullScreenImageModal } from './Modals'; // Importando o novo modal
import { Button } from './Button'; // Import Button

interface ImageResultProps {
  image: GeneratedImage;
  onDownload: () => void;
}

export const ImageResult: React.FC<ImageResultProps> = ({ image, onDownload }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Format the creation date
  const createdAt = new Date(image.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="group relative rounded-2xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl animate-fade-in max-w-[420px] mx-auto transition-shadow duration-500">
        {/* 3:4 Aspect Ratio Container */}
        <div className="aspect-[3/4] w-full relative overflow-hidden cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <img 
            src={image.url} 
            alt={image.prompt} 
            className="w-full h-full object-cover" // Removed transform/scale hover effect
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              
              <div className="flex items-center justify-between mb-4">
                <Button 
                  onClick={(e) => { e.stopPropagation(); onDownload(); }} // Stop propagation to prevent modal opening
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors shadow-2xl shadow-primary/50 font-bold text-sm uppercase tracking-wider"
                >
                  <Download size={18} />
                  Baixar Flyer
                </Button>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  title="Visualizar em tela cheia"
                >
                  <Maximize size={18} />
                </button>
              </div>
              
              <p className="text-gray-500 text-[10px] flex items-center gap-1 uppercase tracking-wider">
                <Clock size={10} />
                Gerado às {createdAt}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {isModalOpen && <FullScreenImageModal imageUrl={image.url} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};