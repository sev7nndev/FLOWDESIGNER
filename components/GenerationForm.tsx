import React, { memo, useState } from 'react';
import { BusinessInfo, GenerationStatus } from '../types';
import { Button } from './Button';
import { Wand2, Sparkles, MapPin, Phone, Building2, Upload, Layers, CheckCircle2, AlertTriangle, Loader2, Zap } from 'lucide-react';
import { UsageData } from '../hooks/useUsage';
import { PricingModal } from './PricingModal'; // Usaremos o modal de preços existente

interface InputFieldProps {
  label: string;
  value: string;
  field: keyof BusinessInfo;
  placeholder: string;
  icon?: React.ReactNode;
  onChange: (field: keyof BusinessInfo, value: string) => void;
  maxLength?: number;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, field, placeholder, icon, onChange, maxLength }) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors flex items-center gap-1.5">
      {icon} {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all outline-none"
    />
  </div>
);

interface GenerationFormProps {
    form: BusinessInfo;
    status: GenerationStatus;
    error?: string;
    handleInputChange: (field: keyof BusinessInfo, value: string) => void;
    handleLogoUpload: (file: File) => void;
    handleGenerate: () => void;
    loadExample: () => void;
    usage: UsageData | null;
    isLoadingUsage: boolean;
}

const GenerationFormComponent: React.FC<GenerationFormProps> = ({
    form, status, error, handleInputChange, handleLogoUpload, handleGenerate, loadExample, usage, isLoadingUsage
}) => {
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const isGenerating = status === GenerationStatus.GENERATING;
    const canGenerate = form.companyName && form.details;
    
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleLogoUpload(file);
    };
    
    const isUnlimited = usage?.maxQuota === 0 && usage?.planId !== 'free';

    // Abre o modal de upgrade se o erro for de quota
    React.useEffect(() => {
        if (error && error.includes("atingiu o limite")) {
            setIsPricingModalOpen(true);
        }
    }, [error]);

    return (
        <>
        <div className="space-y-6">
            {/* Quota Display */}
            <div className="p-4 bg-zinc-900/90 border border-white/10 rounded-xl shadow-inner">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Uso Mensal ({usage?.planId || '...'})
                    </span>
                    {isLoadingUsage ? (
                        <Loader2 size={16} className="animate-spin text-primary" />
                    ) : isUnlimited ? (
                        <span className="text-sm font-bold text-primary">Ilimitado</span>
                    ) : (
                        <span className={`text-sm font-bold ${usage?.isBlocked ? 'text-red-400' : 'text-primary'}`}>
                            {usage?.currentUsage} / {usage?.maxQuota}
                        </span>
                    )}
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-2 rounded-full transition-all duration-500 ${usage?.isBlocked ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${usage?.usagePercentage || 0}%` }}
                    />
                </div>
            </div>
            
            {/* Sections... (o resto do formulário permanece o mesmo) */}
            <div className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                {/* ... Identidade Visual ... */}
                 <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Building2 size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-lg">1. Identidade Visual</h3>
                                <p className="text-xs text-gray-500">Dados principais do negócio</p>
                            </div>
                        </div>
                        <button onClick={loadExample} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium px-3 py-1 rounded-full bg-primary/10">
                            <Wand2 size={14} /> Usar Exemplo
                        </button>
                    </div>
            </div>
            <div className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                {/* ... Endereço & Contato ... */}
                 <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">2. Endereço & Contato</h3>
                            <p className="text-xs text-gray-500">Para o cliente te encontrar</p>
                        </div>
                    </div>
            </div>
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl">
                {/* ... Briefing ... */}
                 <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                        <Layers size={18} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">3. O Pedido (Briefing)</h3>
                        <p className="text-xs text-gray-500">Descreva o que você precisa que a I.A. crie</p>
                    </div>
                </div>
            </div>


            {/* Generation Button & Error */}
            <div className="space-y-4 pt-4">
                <Button 
                    onClick={handleGenerate} 
                    isLoading={isGenerating}
                    className="w-full h-16 text-lg font-bold"
                    disabled={!canGenerate || usage?.isBlocked || isLoadingUsage}
                >
                    {usage?.isBlocked ? (
                        <> <AlertTriangle className="mr-2" /> Limite Atingido </>
                    ) : (
                        <> <Sparkles className="mr-2" /> GERAR ARTE FLOW </>
                    )}
                </Button>
                {error && !error.includes("atingiu o limite") && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                        <AlertTriangle size={14} />
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
        
        {/* Modal de Upgrade */}
        <PricingModal 
            isOpen={isPricingModalOpen} 
            onClose={() => setIsPricingModalOpen(false)}
            // A ação de selecionar plano deve levar à integração de pagamento
            onPlanSelect={() => alert('Integração com pagamento pendente.')} 
        />
        </>
    );
};

export const GenerationForm = memo(GenerationFormComponent);