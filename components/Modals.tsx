import React, { useState, useEffect } from 'react';
import { GeneratedImage, User, UserRole } from '../types';
import { X, Image as ImageIcon, Info, User as UserIcon, Mail, Save, CheckCircle2, Download, CreditCard } from 'lucide-react';
import { Button } from './Button';
import { api } from '../services/api'; // Importando a API

// --- Generic Modal Wrapper ---
interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900 z-10 sticky top-0">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map((img: GeneratedImage) => (
            <div key={img.id} className="group relative aspect-[3/4] bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg transition-all hover:border-primary/50">
              <img 
                src={img.url} 
                alt="Arte" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              
              {/* Overlay de Ação */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-[10px] text-gray-400 truncate mb-2">{img.businessInfo.companyName}</p>
                <Button 
                  variant="primary" 
                  onClick={() => onDownload(img)} 
                  className="h-8 px-3 text-xs w-full"
                  icon={<Download size={14} />}
                >
                  Baixar
                </Button>
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
  onClose: () => void;
  user: User | null;
  updateProfile: (firstName: string, lastName: string) => Promise<boolean | undefined>;
  profileRole: UserRole;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, user, updateProfile, profileRole }) => {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setStatusMessage(null);

    const success = await updateProfile(firstName, lastName);

    if (success) {
      setStatusMessage({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    } else {
      setStatusMessage({ type: 'error', message: 'Falha ao salvar. Tente novamente.' });
    }
    setIsLoading(false);
  };
  
  const handleManageSubscription = async () => {
    setIsBillingLoading(true);
    setStatusMessage(null);
    try {
        const redirectUrl = await api.createBillingPortalSession();
        // Redireciona o usuário para o portal de faturamento
        window.location.href = redirectUrl;
    } catch (e: any) {
        console.error("Billing portal error:", e);
        setStatusMessage({ type: 'error', message: e.message || 'Falha ao acessar o portal de faturamento.' });
    } finally {
        setIsBillingLoading(false);
    }
  };
  
  const roleDisplay: Record<UserRole, { name: string, color: string }> = {
    admin: { name: 'Administrador', color: 'bg-red-600' },
    dev: { name: 'Desenvolvedor', color: 'bg-cyan-600' },
    owner: { name: 'Proprietário', color: 'bg-yellow-600' }, // Adicionado 'owner'
    client: { name: 'Cliente', color: 'bg-blue-600' },
    free: { name: 'Grátis', color: 'bg-gray-500' },
    pro: { name: 'Pro', color: 'bg-primary' },
  };

  const currentRole = roleDisplay[profileRole] || roleDisplay.free;

  return (
    <ModalWrapper title="Configurações Pessoais" onClose={onClose}>
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Status Section */}
        <div className="p-6 bg-zinc-800/50 border border-white/10 rounded-xl space-y-4 shadow-inner shadow-black/20">
            <h4 className="text-lg font-semibold text-white border-b border-white/5 pb-2 mb-4">Status da Conta</h4>
            
            <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm flex items-center gap-2"><Mail size={16} className="text-primary" /> Email:</span>
                <span className="text-white font-medium text-sm">{user?.email}</span>
            </div>
            
            <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm flex items-center gap-2"><UserIcon size={16} className="text-primary" /> Plano:</span>
                <span className={`text-white text-xs font-bold uppercase px-3 py-1 rounded-full ${currentRole.color}`}>
                    {currentRole.name}
                </span>
            </div>
            
            {/* Botão de Gerenciamento de Assinatura */}
            {(profileRole === 'starter' || profileRole === 'pro') && (
                <div className="pt-4 border-t border-white/5">
                    <Button 
                        onClick={handleManageSubscription} 
                        isLoading={isBillingLoading} 
                        variant="secondary" 
                        className="w-full h-10 text-sm"
                        icon={<CreditCard size={16} />}
                    >
                        Gerenciar Assinatura
                    </Button>
                </div>
            )}
            
            {profileRole === 'free' && (
                <div className="pt-4 border-t border-white/5 text-sm text-gray-400 flex items-start gap-2">
                    <Info size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p>Seu plano atual é Grátis. Para remover a marca d'água e ter acesso ilimitado, considere o upgrade para o plano Pro.</p>
                </div>
            )}
        </div>

        {/* Profile Update Form */}
        <form onSubmit={handleSave} className="space-y-6 p-6 bg-zinc-900/50 border border-white/10 rounded-xl shadow-lg">
            <h4 className="text-lg font-semibold text-white border-b border-white/5 pb-2 mb-4">Atualizar Perfil</h4>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Primeiro Nome</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none text-sm"
                        value={firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Sobrenome (Opcional)</label>
                    <input 
                        type="text" 
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none text-sm"
                        value={lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                    />
                </div>
            </div>

            {statusMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    statusMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
                    <p>{statusMessage.message}</p>
                </div>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full h-12 rounded-xl" icon={!isLoading ? <Save size={18} /> : null}>
                Salvar Alterações
            </Button>
        </form>
      </div>
    </ModalWrapper>
  );
};