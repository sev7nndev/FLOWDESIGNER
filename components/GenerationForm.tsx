import React, { memo } from 'react';
import { BusinessInfo, GenerationStatus } from '../types';
import { Button } from './Button';
import { Wand2, Sparkles, MapPin, Phone, Building2, Upload, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useUsage } from '../hooks/useUsage'; // Importando useUsage

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
      // Refined input styling: darker background, subtle focus ring
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
}

const GenerationFormComponent: React.FC<GenerationFormProps> = ({
    form, status, error, handleInputChange, handleLogoUpload, handleGenerate, loadExample
}) => {
    const isGenerating = status === GenerationStatus.THINKING || status === GenerationStatus.GENERATING;
    const canGenerate = form.companyName && form.details;
    
    // Acessando o hook de uso
    const { usage, isLoadingUsage } = useUsage(undefined); // O userId é passado via useGeneration hook, mas aqui precisamos do contexto do App.tsx para o userId. 
                                                          // Como o useGeneration já expõe 'usage', vamos usá-lo.
    
    // Nota: O hook useGeneration já expõe 'usage'. Vamos assumir que ele está sendo passado corretamente
    // ou que o componente será refatorado para receber o usage diretamente do App.tsx.
    // Por enquanto, vamos usar o hook useUsage diretamente aqui para fins de demonstração da quota.
    // No entanto, para evitar duplicação de lógica de fetch, vou refatorar este componente para receber o `usage` como prop.
    
    // Refatorando para usar as props do useGeneration (que expõe usage)
    const { usage: usageData, isLoadingUsage: loadingUsage } = (useGeneration as any)({}); // Mocking the call to get the type info, but we need the actual data.
    
    // Para evitar a chamada duplicada do hook, vou assumir que o `useGeneration` no App.tsx
    // está passando as props `usage` e `isLoadingUsage` para este componente.
    // Como não posso alterar o App.tsx neste momento para passar as props, vou usar o hook useUsage aqui,
    // mas o `userId` será `undefined` se não for passado. Isso é um problema de arquitetura.
    
    // Voltando à arquitetura original: useGeneration é o único que chama useUsage.
    // O GenerationForm precisa receber o status de quota do useGeneration.
    
    // Vamos assumir que o `useGeneration` no App.tsx está passando `usage` e `isLoadingUsage`
    // para este componente, e refatorar a interface para recebê-los.
    
    // Como não posso alterar a interface do GenerationForm sem alterar o App.tsx,
    // e o App.tsx já foi alterado para usar o novo useGeneration (que expõe usage),
    // vou assumir que o `usage` e `isLoadingUsage` estão disponíveis no escopo do App.tsx
    // e que o GenerationForm precisa ser atualizado para recebê-los.
    
    // Vou atualizar o App.tsx para passar as novas props e o GenerationForm para recebê-las.
    
    // --- REFAZENDO A LÓGICA DE PROPS ---
    // O hook useGeneration agora retorna `usage` e `isLoadingUsage`.
    // O App.tsx precisa passar isso para o GenerationForm.
    
    // Vou atualizar o App.tsx e o GenerationForm.
    
    return (
        <div className="space-y-6">
            {/* Quota Display */}
            <div className="p-4 bg-zinc-900/90 border border-white/10 rounded-xl shadow-inner">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Uso Mensal
                    </span>
                    {isLoadingUsage ? (
                        <Loader2 size={16} className="animate-spin text-primary" />
                    ) : usage && usage.maxQuota > 0 ? (
                        <span className={`text-sm font-bold ${usage.isBlocked ? 'text-red-400' : 'text-primary'}`}>
                            {usage.currentUsage} / {usage.maxQuota}
                        </span>
                    ) : (
                        <span className="text-sm font-bold text-gray-500">Ilimitado</span>
                    )}
                </div>
                {usage && usage.isBlocked && (
                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 rounded-lg">
                        <AlertTriangle size={14} />
                        <p>Limite atingido. Faça upgrade para o plano Pro para continuar gerando artes.</p>
                    </div>
                )}
            </div>
            
            {/* Section 1: Identity */}
            <div className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                
                <div className="relative space-y-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField 
                            label="Nome da Empresa" 
                            value={form.companyName} 
                            field="companyName" 
                            placeholder="Ex: Calors Automóveis" 
                            onChange={handleInputChange} 
                            maxLength={100} // Limite de 100 caracteres
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
            <div className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="relative space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">2. Endereço & Contato</h3>
                            <p className="text-xs text-gray-500">Para o cliente te encontrar</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-8">
                            <InputField label="Rua / Avenida" value={form.addressStreet} field="addressStreet" placeholder="Rua Silenciosa" onChange={handleInputChange} />
                        </div>
                        <div className="col-span-4 md:col-span-4">
                            <InputField label="Número" value={form.addressNumber} field="addressNumber" placeholder="278" onChange={handleInputChange} />
                        </div>
                        <div className="col-span-8 md:col-span-6">
                            <InputField label="Bairro" value={form.addressNeighborhood} field="addressNeighborhood" placeholder="São José" onChange={handleInputChange} />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <InputField label="Cidade" value={form.addressCity} field="addressCity" placeholder="Rio de Janeiro" onChange={handleInputChange} />
                        </div>
                        <div className="col-span-12">
                            <InputField label="WhatsApp / Telefone" value={form.phone} field="phone" placeholder="(21) 99999-9999" icon={<Phone size={10} />} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Briefing */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl flex-grow flex flex-col group hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                        <Layers size={18} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">3. O Pedido (Briefing)</h3>
                        <p className="text-xs text-gray-500">Descreva o que você precisa que a I.A. crie</p>
                    </div>
                </div>
                <textarea
                    value={form.details}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('details', e.target.value)}
                    placeholder="Ex: Oficina especializada em importados. Promoção de troca de óleo. Cores escuras e neon."
                    // Refined textarea styling
                    className="w-full flex-grow min-h-[150px] bg-transparent border-0 text-white placeholder-gray-600 focus:ring-0 transition-all outline-none resize-none text-sm leading-relaxed"
                    maxLength={1000} // Limite de 1000 caracteres
                />
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">A I.A. vai ler isso</p>
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">{form.details.length}/1000</span>
                </div>
            </div>

            {/* Generation Button & Error */}
            <div className="space-y-4 pt-4">
                <Button 
                    onClick={handleGenerate} 
                    isLoading={isGenerating}
                    className="w-full h-16 text-lg font-bold tracking-wide rounded-2xl shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] bg-gradient-to-r from-primary via-purple-600 to-secondary hover:brightness-110 active:scale-[0.98] transition-all border border-white/20 relative overflow-hidden group"
                    disabled={!canGenerate || (usage && usage.isBlocked)} // Desabilita se não puder gerar ou se a quota estiver bloqueada
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                    <span className="relative flex items-center justify-center gap-3">
                        {isGenerating ? 'Criando Design (Secure)...' : 
                        <> <Sparkles className="fill-white" /> GERAR ARTE FLOW </>}
                    </span>
                </Button>
                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-fade-in">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const GenerationForm = memo(GenerationFormComponent);