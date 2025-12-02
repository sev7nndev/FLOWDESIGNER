import React, { memo, useState } from 'react';
import { BusinessInfo, GenerationStatus } from '../types';
import { Button } from './Button';
import { Wand2, Sparkles, MapPin, Phone, Building2, Upload, Layers, AlertTriangle, Loader2 } from 'lucide-react';
import { UsageData } from '../hooks/useUsage';
import { PricingModal } from './PricingModal';

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
    // Adicionando a prop onPlanSelect
    onPlanSelect: (planId: string) 
}

const GenerationFormComponent: React.FC<GenerationFormProps> = ({
    form, status, error, handleInputChange, handleLogoUpload, handleGenerate, loadExample, usage, isLoadingUsage, onPlanSelect
}) => {
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const isGenerating = status === GenerationStatus.GENERATING;
    const canGenerate = form.companyName && form.details;
    
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleLogoUpload(file);
    };
    
    const isUnlimited = usage?.maxQuota === 0 && usage?.planId !== 'free';

    React.useEffect(() => {
        if (error && error.includes("atingiu o limite")) {
            setIsPricingModalOpen(true);
        }
    }, [error]);

    return (
        <>
        <div className="space-y-6">
            {/* Usage Display */}
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
                <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-2 rounded-full transition-all duration-500 ${usage?.isBlocked ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${usage?.usagePercentage || 0}%` }}
                    />
                </div>
            </div>
            
            {/* Company Info Section */}
            <div className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4">
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
                        <button 
                          onClick={loadExample} 
                          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium px-3 py-1 rounded-full bg-primary/10 transition-colors"
                        >
                            <Wand2 size={14} /> Usar Exemplo
                        </button>
                    </div>
                <InputField 
                  label="Nome da Empresa" 
                  field="companyName" 
                  value={form.companyName} 
                  onChange={handleInputChange} 
                  placeholder="Ex: Calors Automóveis" 
                  icon={<Building2 size={12} />} 
                />
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Upload size={12} /> Logo (Opcional)
                    </label>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      onChange={onFileChange} 
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" 
                    />
                </div>
            </div>

            {/* Address Section */}
            <div className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4">
                 <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">2. Endereço & Contato</h3>
                            <p className="text-xs text-gray-500">Para o cliente te encontrar</p>
                        </div>
                    </div>
                <InputField label="Telefone / WhatsApp" field="phone" value={form.phone} onChange={handleInputChange} placeholder="(21) 99999-9999" icon={<Phone size={12} />} />
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <InputField label="Rua" field="addressStreet" value={form.addressStreet} onChange={handleInputChange} placeholder="Av. Principal" />
                    </div>
                    <div>
                        <InputField label="Nº" field="addressNumber" value={form.addressNumber} onChange={handleInputChange} placeholder="123" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Bairro" field="addressNeighborhood" value={form.addressNeighborhood} onChange={handleInputChange} placeholder="Centro" />
                    <InputField label="Cidade" field="addressCity" value={form.addressCity} onChange={handleInputChange} placeholder="Rio de Janeiro" />
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl">
                 <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                        <Layers size={18} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">3. O Pedido (Briefing)</h3>
                        <p className="text-xs text-gray-500">Descreva o que você precisa que a I.A. crie</p>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Detalhes do Serviço / Promoção</label>
                    <textarea 
                      value={form.details} 
                      onChange={(e) => handleInputChange('details', e.target.value)} 
                      placeholder="Ex: Lanternagem, pintura, troca de óleo. Especialista em carros importados. Promoção de alinhamento e balanceamento por R$ 80." 
                      rows={4} 
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all outline-none resize-none" 
                    />
                </div>
            </div>

            {/* Generate Button */}
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
        
        <PricingModal 
            isOpen={isPricingModalOpen} 
            onClose={() => setIsPricingModalOpen(false)}
            onPlanSelect={onPlanSelect} // CORREÇÃO A1: Passando a função real
        />
        </>
    );
};

export const GenerationForm = memo(GenerationFormComponent);