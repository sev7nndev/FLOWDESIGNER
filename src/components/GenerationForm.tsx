import React, { memo } from 'react';
import { BusinessInfo, GenerationStatus, QuotaStatus, PlanSetting, ArtStyle } from '@/types';
import { Button } from './Button';
import { Wand2, Sparkles, MapPin, Phone, Building2, Upload, Layers, CheckCircle2, AlertTriangle, Palette, Instagram, Facebook, Globe } from 'lucide-react';
import { ART_STYLES } from '@/src/constants/artStyles';
import { StyleCard } from './StyleCard';

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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value)}
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

    // Style Props
    selectedStyle: ArtStyle;
    setSelectedStyle: (style: ArtStyle) => void;

    // Quota Props
    quotaStatus: QuotaStatus;
    currentUsage: number;
    maxImages: number;
    currentPlan: PlanSetting | undefined;
    openUpgradeModal: () => void;

    // AI Props
    handleEnhancePrompt?: () => void;
    isEnhancing?: boolean;
}

const GenerationFormComponent: React.FC<GenerationFormProps> = ({
    form, status, error, handleInputChange, handleLogoUpload, handleGenerate, loadExample,
    quotaStatus, currentUsage, maxImages, currentPlan, openUpgradeModal,
    handleEnhancePrompt, isEnhancing
}) => {
    const isGenerating = status === GenerationStatus.THINKING || status === GenerationStatus.GENERATING;

    // Validation: All fields required except logo
    const canGenerate =
        form.companyName.trim() !== '' &&
        form.details.trim() !== '' &&
        form.addressStreet.trim() !== '' &&
        form.addressNumber.trim() !== '' &&
        form.addressNeighborhood.trim() !== '' &&
        form.addressCity.trim() !== '' &&
        form.phone.trim() !== '';

    const isBlocked = quotaStatus === QuotaStatus.BLOCKED;
    const isNearLimit = quotaStatus === QuotaStatus.NEAR_LIMIT;

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleLogoUpload(file);
    };

    const handleGenerateClick = () => {
        if (isBlocked) {
            openUpgradeModal();
        } else {
            handleGenerate();
        }
    };

    return (
        <div className="space-y-5">
            {/* Section 1: Identity */}
            <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                <div className="relative space-y-5">
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
                        <button onClick={loadExample} className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium px-3 py-1 rounded-full bg-sky-500/10 transition-colors hover:bg-sky-500/20">
                            <Wand2 size={14} /> Usar Exemplo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField
                            label="Nome da Empresa *"
                            value={form.companyName}
                            field="companyName"
                            placeholder="Ex: Calors Automóveis"
                            onChange={handleInputChange}
                            maxLength={100}
                        />
                        <div className="space-y-1.5 group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Upload size={10} /> Logotipo (Opcional)
                            </label>
                            <div className="relative">
                                <input type="file" accept="image/*" onChange={onFileChange} className="hidden" id="logo-upload" />
                                <label htmlFor="logo-upload" className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm cursor-pointer transition-all flex items-center justify-between hover:border-white/20 ${form.logo ? 'text-green-400 border-green-500/30 bg-green-900/30' : 'text-gray-500 border-white/10'}`}>
                                    <span className="truncate">{form.logo ? 'Logo Carregada' : 'Enviar Imagem (Max 30KB)'}</span>
                                    {form.logo ? <CheckCircle2 size={16} className="text-green-400" /> : <Upload size={16} />}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Contact */}
            <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
                <div className="relative space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">2. Endereço & Contato</h3>
                            <p className="text-xs text-gray-500">Para o cliente te encontrar</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-12 gap-3">
                        {/* Row 1: Address Basic */}
                        <div className="col-span-12 md:col-span-6">
                            <InputField label="Rua / Avenida *" value={form.addressStreet} field="addressStreet" placeholder="Nome da Rua" onChange={handleInputChange} />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                            <InputField label="Nº *" value={form.addressNumber} field="addressNumber" placeholder="123" onChange={handleInputChange} />
                        </div>
                        <div className="col-span-8 md:col-span-4">
                            <InputField label="Bairro *" value={form.addressNeighborhood} field="addressNeighborhood" placeholder="Bairro" onChange={handleInputChange} />
                        </div>

                        {/* Row 2: City & Contacts */}
                        <div className="col-span-12 md:col-span-4">
                            <InputField label="Cidade *" value={form.addressCity} field="addressCity" placeholder="Cidade" onChange={handleInputChange} />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <InputField label="WhatsApp *" value={form.phone} field="phone" placeholder="(XX) 99999-9999" icon={<Phone size={10} />} onChange={handleInputChange} />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <InputField label="Email (Opcional)" value={form.email || ''} field="email" placeholder="email@exemplo.com" onChange={handleInputChange} />
                        </div>

                        {/* Row 3: Socials - Very Compact */}
                        <div className="col-span-12 md:col-span-4">
                            <InputField label="Instagram" value={form.instagram || ''} field="instagram" placeholder="@seuinsta" icon={<Instagram size={10} />} onChange={handleInputChange} />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <InputField label="Facebook" value={form.facebook || ''} field="facebook" placeholder="/suapagina" icon={<Facebook size={10} />} onChange={handleInputChange} />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <InputField label="Site" value={form.website || ''} field="website" placeholder="www.site.com" icon={<Globe size={10} />} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Briefing */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl p-4 shadow-2xl flex-grow flex flex-col group hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                            <Layers size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">3. O Pedido (Briefing)</h3>
                            <p className="text-xs text-gray-500">Descreva o que você precisa que a I.A. crie</p>
                        </div>
                    </div>
                    {handleEnhancePrompt && (
                        <button
                            onClick={handleEnhancePrompt}
                            disabled={isEnhancing}
                            className="text-sm text-lime-400 hover:text-lime-300 flex items-center gap-1 font-medium px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 transition-all hover:bg-lime-500/20 shadow-[0_0_15px_-5px_rgba(132,204,22,0.5)]"
                        >
                            <Sparkles size={14} className={isEnhancing ? "animate-spin" : ""} />
                            {isEnhancing ? "Melhorando..." : "Melhorar com IA"}
                        </button>
                    )}
                </div>
                <textarea
                    value={form.details}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('details', e.target.value)}
                    placeholder="Ex: Oficina especializada em importados. Promoção de troca de óleo. Cores escuras e neon."
                    className="w-full flex-grow min-h-[80px] bg-transparent border-0 text-white placeholder-gray-600 focus:ring-0 transition-all outline-none resize-none text-sm leading-relaxed"
                    maxLength={1000}
                />
                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">A I.A. vai ler isso</p>
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">{form.details.length}/1000</span>
                </div>
            </div>

            {/* Quota Status Display */}
            {currentPlan && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${isBlocked ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                    isNearLimit ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
                        'bg-green-500/10 border border-green-500/20 text-green-400'
                    }`}>
                    <AlertTriangle size={16} className={isBlocked ? 'text-red-500' : 'text-yellow-500'} />
                    <p>
                        {isBlocked
                            ? `Limite atingido! Você usou ${currentUsage}/${maxImages} do seu plano ${currentPlan.id.toUpperCase()}.`
                            : isNearLimit
                                ? `Atenção: Você usou ${currentUsage}/${maxImages} do seu plano ${currentPlan.id.toUpperCase()}.`
                                : `Plano ${currentPlan.id.toUpperCase()} ativo. Você usou ${currentUsage}/${maxImages} imagens este mês.`
                        }
                    </p>
                    {(isBlocked || isNearLimit) && (
                        <button onClick={openUpgradeModal} className="text-primary font-bold ml-auto hover:underline">
                            Upgrade
                        </button>
                    )}
                </div>
            )}

            {/* Generation Button & Error */}
            <div className="space-y-4 pt-4">
                <Button
                    onClick={handleGenerateClick}
                    isLoading={isGenerating}
                    className="w-full h-14 text-lg font-bold tracking-wide rounded-xl shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] bg-gradient-to-r from-primary via-purple-600 to-secondary hover:brightness-110 active:scale-[0.98] transition-all border border-white/20 relative overflow-hidden group"
                    disabled={!canGenerate && !isBlocked} // Disable if no input AND not blocked (if blocked, the button handles the modal)
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                    <span className="relative flex items-center justify-center gap-3">
                        {isGenerating ? '✨ Criando sua Arte Exclusiva...' :
                            isBlocked ? 'VER PLANOS (LIMITE ATINGIDO)' :
                                <> <Sparkles className="fill-white" /> GERAR ARTE FLOW </>}
                    </span>
                </Button>
                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-fade-in">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                        <p className="break-words">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const GenerationForm = memo(GenerationFormComponent);