import React from 'react';
import { GeneratedImage } from '../types';
import { Info, Clock, Code, Image, Download } from 'lucide-react';
import { Modal } from './Modal'; 
import { Button } from './Button';

interface GenerationDetailsModalProps {
    image: GeneratedImage;
    onClose: () => void;
    onDownload: (url: string, filename: string) => void;
}

export const GenerationDetailsModal: React.FC<GenerationDetailsModalProps> = ({ image, onClose, onDownload }) => {
    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('pt-BR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    
    const handleDownload = () => {
        onDownload(image.url, `flow-design-${image.id}-details.png`);
    };

    const DetailItem: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
        <div className="flex items-start space-x-3 p-3 bg-zinc-800 rounded-lg">
            <div className="text-primary flex-shrink-0 mt-1">{icon}</div>
            <div>
                <p className="text-sm font-medium text-zinc-400">{label}</p>
                <p className="text-white break-words">{value}</p>
            </div>
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title="Detalhes da Geração" size="lg">
            <div className="space-y-6">
                
                <div className="w-full h-auto rounded-lg overflow-hidden border border-zinc-700">
                    <img 
                        src={image.url} 
                        alt="Imagem Gerada" 
                        className="w-full h-full object-cover"
                    />
                </div>
                
                <div className="flex justify-end">
                    <Button 
                        variant="primary" 
                        onClick={handleDownload}
                        icon={<Download size={18} />}
                    >
                        Download
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem 
                        icon={<Clock size={20} />} 
                        label="Criado em" 
                        value={formatTimestamp(image.createdAt)} 
                    />
                    <DetailItem 
                        icon={<Image size={20} />} 
                        label="Aspect Ratio" 
                        value={image.aspectRatio} 
                    />
                    <DetailItem 
                        icon={<Code size={20} />} 
                        label="Estilo" 
                        value={image.style} 
                    />
                    <DetailItem 
                        icon={<Info size={20} />} 
                        label="ID do Usuário" 
                        value={image.userId} 
                    />
                </div>

                <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <p className="text-sm font-medium text-zinc-400 mb-2">Prompt (Descrição do Negócio)</p>
                    <p className="text-white whitespace-pre-wrap">{image.prompt}</p>
                </div>

                <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <p className="text-sm font-medium text-zinc-400 mb-2">Negative Prompt</p>
                    <p className="text-white whitespace-pre-wrap">{image.negativePrompt || 'N/A'}</p>
                </div>
            </div>
        </Modal>
    );
};