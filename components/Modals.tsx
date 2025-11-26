import React from 'react';
import { GeneratedImage, AppSettings } from '../types';
import { X, Image as ImageIcon, Trash2, Info } from 'lucide-react';
import { Button } from './Button';

// --- Generic Modal Wrapper ---
interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900 z-10">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto p-6 custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

// --- Gallery Modal ---
interface GalleryModalProps {
  history: GeneratedImage[];
  onClose: () => void;
  onDownload: (img: GeneratedImage) => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({ history, onClose, onDownload }) => {
  return (
    <ModalWrapper title={`Minha Galeria (${history.length})`} onClose={onClose}>
      {history.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
          <p>Nenhuma arte gerada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map((img) => (
            <div key={img.id} className="group relative aspect-[3/4] bg-black rounded-lg overflow-hidden border border-white/10">
              <img src={img.url} alt="Arte" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="secondary" onClick={() => onDownload(img)} className="h-8 px-3 text-xs">
                  Baixar
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black to-transparent">
                 <p className="text-[10px] text-gray-300 truncate">{img.businessInfo.companyName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalWrapper>
  );
};

// --- User Settings Modal ---
interface SettingsModalProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  // Settings are now only Supabase keys, which are managed by AdminDashboard.
  // Personal AI keys are removed for security.

  return (
    <ModalWrapper title="Configurações Pessoais" onClose={onClose}>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="p-6 bg-zinc-800/50 border border-white/10 rounded-lg text-gray-300 text-sm flex items-start gap-3">
          <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <p>
            As configurações de chaves de API de Inteligência Artificial foram movidas para o servidor seguro. 
            Este painel agora é usado apenas para configurações futuras do usuário.
          </p>
        </div>
      </div>
    </ModalWrapper>
  );
};