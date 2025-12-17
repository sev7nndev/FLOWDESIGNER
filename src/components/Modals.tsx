import React, { useState, useEffect } from 'react';
import { GeneratedImage, User, UserRole, QuotaCheckResponse, QuotaStatus, EditablePlan } from '../../types';
import { X, Image as ImageIcon, Info, User as UserIcon, Mail, Save, CheckCircle2, Download, Zap, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { api } from '../../services/api';
import { toast } from 'sonner';

// --- Generic Modal Wrapper ---
interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
  maxWidth?: string;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, onClose, children, maxWidth = 'max-w-4xl' }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
    <div className={`bg-zinc-900 border border-white/10 rounded-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-2xl overflow-hidden`}>
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
  onDelete: (img: GeneratedImage) => void;
  isLoading?: boolean;
}

const GalleryImage: React.FC<{
  img: GeneratedImage;
  onDownload: (img: GeneratedImage) => void;
  onDelete: (img: GeneratedImage) => void;
  onClick: (img: GeneratedImage) => void;
}> = ({ img, onDownload, onDelete, onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="group relative aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden border border-white/10 shadow-lg transition-all hover:border-primary/50 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(img);
      }}
    >
      {/* Skeleton Loading State */}
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
          <ImageIcon size={24} className="text-zinc-700 animate-bounce" />
        </div>
      )}

      <img
        src={img.url}
        alt="Arte"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}
      />

      {/* Overlay de Ação */}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
        <p className="text-[10px] text-gray-400 truncate text-center">{img.businessInfo?.companyName || 'Sem nome'}</p>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={(e) => { e.stopPropagation(); onDownload(img); }}
            className="h-8 px-2 text-xs flex-1"
            icon={<Download size={14} />}
          >
            Baixar
          </Button>
          <Button
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Tem certeza que deseja excluir esta imagem?')) {
                onDelete(img);
              }
            }}
            className="h-8 w-8 p-0 flex items-center justify-center"
            icon={<Trash2 size={16} />}
          />
        </div>
      </div>
    </div>
  );
};

export const GalleryModal: React.FC<GalleryModalProps> = ({ history, onClose, onDownload, onDelete, isLoading = false }) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  return (
    <>
      <ModalWrapper title={`Minha Galeria (${history.length})`} onClose={onClose}>
        {isLoading ? (
          <div className="text-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium">Carregando histórico...</p>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma arte gerada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((img: GeneratedImage) => (
              <GalleryImage
                key={img.id}
                img={img}
                onDownload={onDownload}
                onDelete={onDelete}
                onClick={setSelectedImage}
              />
            ))}
          </div>
        )}
      </ModalWrapper>

      {/* Lightbox Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-4 z-50">
            <Button
              variant="primary"
              onClick={(e) => { e.stopPropagation(); onDownload(selectedImage); }}
              className="shadow-xl"
              icon={<Download size={18} />}
            >
              Baixar Original
            </Button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="max-w-7xl max-h-screen relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt="Full View"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 flex gap-4">
              <div className="bg-zinc-900/80 px-4 py-2 rounded-full border border-white/10 text-white text-sm">
                {selectedImage.businessInfo.companyName}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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

  const roleDisplay: Record<UserRole, { name: string, color: string }> = {
    admin: { name: 'Administrador', color: 'bg-red-600' },
    dev: { name: 'Desenvolvedor', color: 'bg-cyan-600' },
    owner: { name: 'Dono', color: 'bg-purple-800' },
    client: { name: 'Cliente', color: 'bg-blue-600' },
    free: { name: 'Grátis', color: 'bg-gray-500' },
    starter: { name: 'Starter', color: 'bg-yellow-600' },
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
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
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

// --- Upgrade Modal ---
interface UpgradeModalProps {
  onClose: () => void;
  quotaResponse: QuotaCheckResponse;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, quotaResponse }) => {
  // quotaResponse now includes 'plans' array
  const { usage, plan, plans } = quotaResponse;
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Find the current plan details from the full list
  const currentPlan = plans.find((p: EditablePlan) => p.id === usage.plan_id);
  // Filter plans for upgrade options (excluding free and current plan)
  const upgradePlans = plans.filter((p: EditablePlan) => p.id !== 'free' && p.id !== usage.plan_id);

  // Ensure plan.max_images_per_month is treated as a number
  const maxImages = plan.max_images_per_month || 0;
  const usagePercentage = maxImages > 0 ? (usage.images_generated / maxImages) * 100 : 0;
  const isBlocked = quotaResponse.status === QuotaStatus.BLOCKED;

  const handleSubscribe = async (planId: string) => {
    setIsSubscribing(true);
    try {
      const { paymentUrl } = await api.initiateSubscription(planId);

      // Redirect user to Mercado Pago
      window.location.href = paymentUrl;

    } catch (e: any) {
      toast.error(e.message || "Falha ao iniciar pagamento. Verifique a conexão do Mercado Pago no Painel Dev.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <ModalWrapper title={isBlocked ? "Limite Atingido" : "Quase no Limite"} onClose={onClose} maxWidth="max-w-3xl">
      <div className="space-y-6">

        {isBlocked && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <Zap size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-lg font-bold text-white">Geração Bloqueada</h4>
              <p className="text-sm text-red-300 mt-1">Você atingiu o limite de {maxImages} imagens do seu plano {currentPlan?.display_name || usage.plan_id.toUpperCase()}. Faça upgrade para continuar criando.</p>
            </div>
          </div>
        )}

        {/* Usage Status */}
        <div className="p-6 bg-zinc-800/50 border border-white/10 rounded-xl space-y-4">
          <h4 className="text-lg font-semibold text-white">Seu Uso Atual</h4>

          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Plano Atual:</span>
            <span className={`text-white font-bold uppercase px-2 py-0.5 rounded-full ${currentPlan?.id === 'free' ? 'bg-gray-500' : 'bg-primary'}`}>
              {currentPlan?.display_name || usage.plan_id}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Imagens Usadas:</span>
            <span className="text-white font-bold">{usage.images_generated} / {maxImages}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${usagePercentage >= 80 ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 pt-2">Seu ciclo de uso começou em: {new Date(usage.cycle_start_date).toLocaleDateString()}</p>
        </div>

        {/* Upgrade Options */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Opções de Upgrade</h4>

          <div className="grid grid-cols-2 gap-4">
            {upgradePlans.map((p: EditablePlan) => (
              <div key={p.id} className={`p-5 rounded-xl border transition-all ${p.id === 'pro' ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' : 'border-white/10 bg-zinc-900/50'}`}>
                <h5 className="text-xl font-bold text-white uppercase">{p.display_name}</h5>
                <p className="text-3xl font-extrabold text-white mt-1 mb-2">R$ {p.price.toFixed(2)} <span className="text-sm text-gray-500 font-normal">/mês</span></p>
                <p className="text-sm text-gray-400 mb-4">{p.max_images_per_month} imagens por mês.</p>

                <Button
                  onClick={() => handleSubscribe(p.id)}
                  isLoading={isSubscribing}
                  className="w-full h-10 text-sm"
                  variant={p.id === 'pro' ? 'primary' : 'secondary'}
                >
                  {isSubscribing ? 'Redirecionando...' : `Assinar ${p.display_name}`}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button variant="ghost" onClick={onClose} icon={<ArrowLeft size={16} />}>
            Voltar
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};