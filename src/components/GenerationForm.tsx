import React, { memo, useState } from 'react';
import { BusinessInfo, GenerationStatus, QuotaStatus, PlanSetting, ArtStyle } from '../../types';
import { Button } from './Button';
import { Wand2, Sparkles, MapPin, Phone, Building2, Layers, AlertTriangle, Palette, Instagram, Facebook, Globe, Briefcase, X } from 'lucide-react';
import { formatPhone, isValidEmail, parseServices } from '../utils/inputMasks';
import { ART_STYLES } from '../constants/artStyles';
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
    form, status, error, handleInputChange, handleGenerate, loadExample,
    quotaStatus, currentUsage, maxImages, currentPlan, openUpgradeModal,
    handleEnhancePrompt, isEnhancing
}) => {
    const isGenerating = status === GenerationStatus.THINKING || status === GenerationStatus.GENERATING;
    
    // Services state
    const [servicesInput, setServicesInput] = useState('');
    const [services, setServices] = useState<string[]>(form.services || []);
    
    // Handle phone formatting
    const handlePhoneChange = (value: string) => {
        const formatted = formatPhone(value);
        handleInputChange('phone', formatted);
    };
    
    // Handle services with duplicate detection
    const addService = () => {
        if (servicesInput.trim() && services.length < 10) {
            const trimmed = servicesInput.trim().toLowerCase();
            // Check for duplicates (case-insensitive)
            const isDuplicate = services.some(s => s.toLowerCase() === trimmed);
            
            if (!isDuplicate) {
                const newServices = [...services, servicesInput.trim()];
                setServices(newServices);
                handleInputChange('services' as any, newServices as any);
                setServicesInput('');
            } else {
                // Visual feedback for duplicate
                alert('Este serviço já foi adicionado!');
            }
        }
    };
    
    const removeService = (index: number) => {
        const newServices = services.filter((_, i) => i !== index);
        setServices(newServices);
        handleInputChange('services' as any, newServices as any);
    };

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

                    <div className="grid grid-cols-1 gap-5">
                        <InputField
                            label="Nome da Empresa *"
                            value={form.companyName}
                            field="companyName"
                            placeholder="Ex: Calors Automóveis"
                            onChange={handleInputChange}
                        />
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
                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors flex items-center gap-1.5">
                                    <Phone size={10} /> WhatsApp *
                                </label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    placeholder="(21) 99999-9999"
                                    maxLength={15}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all outline-none"
                                />
                            </div>
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

            {/* Section 2.5: Services */}
            <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
                <div className="relative space-y-4">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                            <Briefcase size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">2.5. Serviços Oferecidos</h3>
                            <p className="text-xs text-gray-500">O que sua empresa faz (até 10 serviços). Recomendado: adicione 1 serviço por vez</p>
                        </div>
                    </div>

                    {/* Services Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={servicesInput}
                            onChange={(e) => setServicesInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                            placeholder="Ex: Troca de óleo, Alinhamento, Balanceamento..."
                            disabled={services.length >= 10}
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all outline-none disabled:opacity-50"
                        />
                        <button
                            onClick={addService}
                            disabled={!servicesInput.trim() || services.length >= 10}
                            className="px-4 py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl hover:bg-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                        >
                            Adicionar
                        </button>
                    </div>

                    {/* Services Chips */}
                    {services.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {services.map((service, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm"
                                >
                                    <span>{service}</span>
                                    <button
                                        onClick={() => removeService(index)}
                                        className="hover:bg-green-500/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Counter */}
                    <p className="text-xs text-gray-500">
                        {services.length}/10 serviços adicionados
                        {services.length === 0 && ' (opcional, mas recomendado)'}
                    </p>
                </div>
            </div>

            {/* Section 2.6: Promoção e Preço (DIFERENCIAL) */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
                <div className="relative space-y-4">
                    <div className="flex items-center gap-3 border-b border-yellow-500/20 pb-4">
                        <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">2.6. Promoção e Preço Destaque</h3>
                            <p className="text-xs text-gray-400">Destaque ofertas especiais (opcional)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Promotion */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                🎁 Promoção Especial
                            </label>
                            <input
                                type="text"
                                value={form.promotion || ''}
                                onChange={(e) => handleInputChange('promotion' as any, e.target.value)}
                                placeholder="Ex: 20% OFF na primeira compra"
                                className="w-full bg-zinc-900 border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all outline-none"
                            />
                        </div>

                        {/* Price */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                💰 Preço Destaque
                            </label>
                            <input
                                type="text"
                                value={form.price || ''}
                                onChange={(e) => handleInputChange('price' as any, e.target.value)}
                                placeholder="Ex: A partir de R$ 49,90"
                                className="w-full bg-zinc-900 border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-yellow-400/70">
                        💡 Dica: Promoções e preços em destaque aumentam conversões!
                    </p>
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

            {/* Quota Status Display - SENIOR LOGIC UPDATE */}
            {currentPlan && (
                <div className={`p-4 rounded-xl text-sm flex items-start gap-3 animate-fade-in border ${
                    currentPlan.id === 'dev' || currentPlan.id === 'owner' || currentPlan.id === 'admin'
                        ? 'bg-purple-900/20 border-purple-500/30 text-purple-300'
                        : isBlocked 
                            ? 'bg-red-900/10 border-red-500/30 text-red-300' // Blocked Style
                            : isNearLimit 
                                ? 'bg-yellow-900/10 border-yellow-500/30 text-yellow-300' 
                                : 'bg-green-900/10 border-green-500/30 text-green-300'
                    }`}>
                    
                    {/* Icon */}
                    <div className="mt-0.5">
                        {currentPlan.id === 'dev' || currentPlan.id === 'owner' || currentPlan.id === 'admin' ? (
                            <Sparkles size={18} className="text-purple-400" />
                        ) : (
                            <AlertTriangle size={18} className={isBlocked ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-green-400'} />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                        {currentPlan.id === 'dev' || currentPlan.id === 'owner' || currentPlan.id === 'admin' ? (
                            <p className="font-semibold">✨ Conta Mestre: Geração Ilimitada Ativa</p>
                        ) : (
                            isBlocked ? (
                                // BLOCKED STATES (Specific Logic)
                                <div className="space-y-2">
                                    <p className="font-bold uppercase tracking-wide text-xs opacity-70">Limite Atingido ({currentUsage}/{maxImages})</p>
                                    
                                    {currentPlan.id === 'free' && (
                                        <p>Seus créditos gratuitos acabaram. Para continuar gerando artes profissionais, <b>escolha o Plano Starter (20 artes) ou Pro (50 artes)</b>.</p>
                                    )}
                                    
                                    {currentPlan.id === 'starter' && (
                                        <p>Você atingiu o limite do Plano Starter. <b>Faça upgrade para o PRO</b> para liberar mais 30 imagens agora, ou aguarde a renovação do seu ciclo mensal.</p>
                                    )}

                                    {currentPlan.id === 'pro' && (
                                        <p>Você é um usuário Power! Atingiu o limite máximo do sistema (50 artes). Aguarde a renovação do seu ciclo para gerar mais.</p>
                                    )}

                                    {/* Action Buttons */}
                                    {currentPlan.id !== 'pro' && (
                                        <button 
                                            onClick={openUpgradeModal} 
                                            className="mt-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white font-bold text-xs transition-colors w-full md:w-auto"
                                        >
                                            {currentPlan.id === 'free' ? 'DESBLOQUEAR AGORA' : 'FAZER UPGRADE PARA PRO'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                // NORMAL STATES
                                <div>
                                    <p className="font-medium">
                                        {isNearLimit 
                                            ? `Atenção: Seu plano ${currentPlan.displayName || currentPlan.id} está quase no fim.` 
                                            : `Plano ${currentPlan.displayName || currentPlan.id} ativo.`
                                        }
                                    </p>
                                    <div className="w-full bg-black/20 h-2 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className={`h-full ${isNearLimit ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                            style={{ width: `${Math.min((currentUsage / maxImages) * 100, 100)}%` }} 
                                        />
                                    </div>
                                    <p className="text-xs opacity-60 mt-1">{currentUsage} de {maxImages} imagens usadas neste ciclo.</p>
                                </div>
                            )
                        )}
                    </div>
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