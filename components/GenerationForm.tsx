import React, { useMemo, useState } from 'react';
import { GenerationFormProps, UsageData, GenerationStatus, FormState, BusinessInfo } from '../types'; // FIX: Corrected imports (Errors 16, 17, 18, 19, 20)
import { Button } from './Button';
import { Image, Upload, Loader2, Info, Zap, Star, Sparkles } from 'lucide-react'; 

// Componente de exibição de uso
interface UsageDisplayProps {
    usage: UsageData;
    isLoading: boolean;
}

const UsageDisplay: React.FC<UsageDisplayProps> = ({ usage, isLoading }) => {
    const { current_usage, max_usage, plan_id } = usage;
    
    const isUnlimited = max_usage === -1;
    const remaining = isUnlimited ? 'Ilimitado' : max_usage - current_usage;
    const percentage = isUnlimited ? 100 : (current_usage / max_usage) * 100;
    
    const planName = plan_id === 'pro' ? 'Pro' : plan_id === 'starter' ? 'Starter' : 'Free';
    const planIcon = plan_id === 'pro' ? <Star size={16} className="text-yellow-400" /> : <Zap size={16} className="text-blue-400" />;
    
    if (isLoading) {
        return <p className="text-sm text-gray-500 flex items-center"><Loader2 size={16} className="animate-spin mr-2" /> Carregando uso...</p>;
    }

    return (
        <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/10 shadow-inner">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                    {planIcon} Plano {planName}
                </span>
                <span className="text-xs font-medium text-gray-400">
                    {isUnlimited ? 'Uso Ilimitado' : `${current_usage} de ${max_usage} gerações`}
                </span>
            </div>
            
            {!isUnlimited && (
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${percentage > 80 ? 'bg-red-500' : 'bg-primary'}`} 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
                {isUnlimited 
                    ? 'Você tem gerações ilimitadas.' 
                    : `Restantes: ${remaining} gerações.`
                }
            </p>
            
            {remaining === 0 && !isUnlimited && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <Info size={14} /> Seu limite de uso foi atingido. Considere o upgrade.
                </p>
            )}
        </div>
    );
};


export const GenerationForm: React.FC<GenerationFormProps> = ({ 
    form, 
    status, 
    error, 
    handleInputChange, 
    handleLogoUpload, 
    handleGenerate, 
    loadExample,
    usage,
    isLoadingUsage
}) => {
    const isGenerating = status === GenerationStatus.GENERATING;
    const [validationErrors, setValidationErrors] = useState<{ prompt?: string, companyName?: string, logo?: string } | null>(null);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors(null);
        
        const errors: { prompt?: string, companyName?: string } = {};
        
        // 1. Validação do Prompt
        if (!form.prompt.trim()) {
            errors.prompt = 'O prompt de descrição é obrigatório.';
        } else if (form.prompt.trim().length < 10) {
            errors.prompt = 'O prompt deve ter pelo menos 10 caracteres.';
        }
        
        // 2. Validação do Nome da Empresa
        if (!form.companyName.trim()) {
            errors.companyName = 'O nome da empresa é obrigatório.';
        } else if (form.companyName.trim().length > 50) {
            errors.companyName = 'O nome da empresa não pode exceder 50 caracteres.';
        }
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        
        // Se a validação passar, chama a função de geração
        handleGenerate();
    };

    const isUsageExceeded = useMemo(() => {
        if (isLoadingUsage || usage.max_usage === -1) return false;
        return usage.current_usage >= usage.max_usage;
    }, [usage, isLoadingUsage]);

    return (
        <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl shadow-xl border border-white/10 space-y-6">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3 mb-4">
                <Image size={24} className="inline mr-2 text-primary" /> Gerador de Arte IA
            </h2>
            
            <UsageDisplay usage={usage} isLoading={isLoadingUsage} />

            <form onSubmit={handleFormSubmit} className="space-y-6">
                
                {/* 1. Prompt de Descrição */}
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                        Descrição da Arte (Prompt)
                    </label>
                    <textarea
                        id="prompt"
                        name="prompt"
                        rows={4}
                        placeholder="Ex: Um logo minimalista de um leão dourado em estilo geométrico, fundo preto, alta definição."
                        value={form.prompt}
                        onChange={handleInputChange}
                        className={`w-full bg-black/50 border rounded-lg px-4 py-3 text-white focus:border-primary outline-none text-sm resize-none ${
                            validationErrors?.prompt ? 'border-red-500' : 'border-white/10'
                        }`}
                        disabled={isGenerating}
                    />
                    {validationErrors?.prompt && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                            <Info size={14} /> {validationErrors.prompt}
                        </p>
                    )}
                </div>

                {/* 2. Nome da Empresa */}
                <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                        Nome da Empresa (Para Marca d'Água)
                    </label>
                    <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        placeholder="Flow Designer"
                        value={form.companyName}
                        onChange={handleInputChange}
                        className={`w-full bg-black/50 border rounded-lg px-4 py-3 text-white focus:border-primary outline-none text-sm ${
                            validationErrors?.companyName ? 'border-red-500' : 'border-white/10'
                        }`}
                        disabled={isGenerating}
                    />
                    {validationErrors?.companyName && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                            <Info size={14} /> {validationErrors.companyName}
                        </p>
                    )}
                </div>

                {/* 3. Upload de Logo (Opcional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Logo para Referência (Opcional)
                    </label>
                    <input
                        id="logoFile"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={isGenerating}
                    />
                    <label 
                        htmlFor="logoFile" 
                        className={`flex items-center justify-center w-full h-16 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            isGenerating ? 'bg-gray-700/50 border-gray-600 text-gray-500' : 'bg-black/50 border-primary/50 hover:bg-primary/10 text-primary'
                        }`}
                    >
                        <Upload size={20} className="mr-2" />
                        {form.logoFile ? `Arquivo Selecionado: ${form.logoFile.name}` : 'Clique para fazer upload de um logo'}
                    </label>
                    {validationErrors?.logo && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                            <Info size={14} /> {validationErrors.logo}
                        </p>
                    )}
                </div>

                {/* Mensagem de Erro Geral do Backend */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                        <Info size={16} />
                        <p>{error}</p>
                    </div>
                )}

                {/* Botão de Ação */}
                <div className="flex flex-col gap-3 pt-4">
                    <Button 
                        type="submit" 
                        isLoading={isGenerating} 
                        disabled={isGenerating || isUsageExceeded}
                        className="w-full h-12 text-lg"
                        icon={!isGenerating ? <Sparkles size={20} /> : null}
                    >
                        {isGenerating ? 'Gerando Arte...' : 'Gerar Arte com IA'}
                    </Button>
                    
                    {isUsageExceeded && (
                        <p className="text-center text-sm text-red-400">
                            Seu limite de uso foi atingido. Não é possível gerar mais artes.
                        </p>
                    )}

                    <Button 
                        type="button" 
                        variant="tertiary" 
                        onClick={loadExample} 
                        disabled={isGenerating}
                        className="w-full h-10 text-sm"
                    >
                        Carregar Exemplo
                    </Button>
                </div>
            </form>
        </div>
    );
};