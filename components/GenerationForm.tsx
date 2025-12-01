import React from 'react';
import { GenerationFormState, GenerationStatus, UsageData } from '../types';
import { UploadLogo } from "@/components/UploadLogo";
import { Button } from "@/components/ui/Button"; // Revertido para o padrão
import { Input } from "@/components/ui/Input"; // Revertido para o padrão
import { Textarea } from "@/components/ui/Textarea"; // Revertido para o padrão
import { Sparkles, Loader2, Zap, Info } from 'lucide-react';
import { Tooltip } from "@/components/ui/Tooltip"; // Revertido para o padrão

interface GenerationFormProps {
    form: GenerationFormState;
    status: GenerationStatus;
    error: string | null;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleLogoUpload: (file: File | null) => void;
    handleGenerate: () => Promise<void>;
    loadExample: () => void;
    usage: UsageData | null;
    isLoadingUsage: boolean;
}

export const GenerationForm: React.FC<GenerationFormProps> = ({
    form,
    status,
    error,
    handleInputChange,
    handleLogoUpload,
    handleGenerate,
    loadExample,
    usage,
    isLoadingUsage,
}) => {
    const isGenerating = status === 'PENDING';
    const isBlocked = usage?.quotaStatus === 'BLOCKED';
    const isFreePlan = usage?.planId === 'free';
    const isUsageAvailable = usage && !isLoadingUsage;

    const getButtonText = () => {
        if (isGenerating) return 'Gerando Arte...';
        if (isBlocked) return 'Limite Atingido';
        return 'Gerar Arte Final';
    };

    const getButtonIcon = () => {
        if (isGenerating) return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
        if (isBlocked) return <Zap className="mr-2 h-4 w-4" />;
        return <Sparkles className="mr-2 h-4 w-4" />;
    };

    const getUsageMessage = () => {
        if (isLoadingUsage) return 'Carregando uso...';
        if (!usage) return 'Não foi possível carregar o uso.';

        const current = usage.currentUsage;
        const max = usage.maxQuota;
        const remaining = max - current;

        if (usage.planId === 'admin' || usage.planId === 'dev') {
            return 'Uso Ilimitado (Admin/Dev)';
        }

        if (isBlocked) {
            return `Limite de ${max} gerações atingido. Faça upgrade.`;
        }

        return `Uso: ${current} de ${max} gerações (${remaining} restantes)`;
    };

    return (
        <div className="bg-zinc-900 p-6 rounded-xl shadow-2xl border border-zinc-800/50">
            <h2 className="text-xl font-semibold mb-4 text-white">1. Detalhes do Negócio</h2>
            
            <div className="space-y-4">
                <Input
                    label="Nome da Empresa"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleInputChange}
                    placeholder="Ex: Barbearia do Zé"
                    disabled={isGenerating}
                />

                <Input
                    label="Telefone/WhatsApp"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="Ex: (11) 99999-9999"
                    disabled={isGenerating}
                />

                <Textarea
                    label="Serviços e Diferenciais (Obrigatório)"
                    name="details"
                    value={form.details}
                    onChange={handleInputChange}
                    placeholder="Ex: Cortes modernos. Barba terapia. Atendimento com hora marcada. Cerveja gelada."
                    rows={4}
                    disabled={isGenerating}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Rua/Avenida"
                        name="addressStreet"
                        value={form.addressStreet}
                        onChange={handleInputChange}
                        placeholder="Ex: Av. Brasil"
                        disabled={isGenerating}
                    />
                    <Input
                        label="Número"
                        name="addressNumber"
                        value={form.addressNumber}
                        onChange={handleInputChange}
                        placeholder="Ex: 1234"
                        disabled={isGenerating}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Bairro"
                        name="addressNeighborhood"
                        value={form.addressNeighborhood}
                        onChange={handleInputChange}
                        placeholder="Ex: Centro"
                        disabled={isGenerating}
                    />
                    <Input
                        label="Cidade/Estado"
                        name="addressCity"
                        value={form.addressCity}
                        onChange={handleInputChange}
                        placeholder="Ex: São Paulo - SP"
                        disabled={isGenerating}
                    />
                </div>

                <UploadLogo 
                    onLogoUpload={handleLogoUpload}
                    currentLogo={form.logo}
                    disabled={isGenerating}
                />
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex justify-between items-center">
                    <Button 
                        variant="secondary" 
                        onClick={loadExample}
                        disabled={isGenerating}
                        className="w-full mr-2"
                    >
                        Carregar Exemplo
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || isBlocked}
                        className={`w-full ${isBlocked ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}
                    >
                        {getButtonIcon()}
                        {getButtonText()}
                    </Button>
                </div>

                {error && (
                    <p className="text-red-400 text-sm p-2 bg-red-900/50 rounded-md border border-red-800">
                        Erro: {error}
                    </p>
                )}

                {isUsageAvailable && (
                    <div className="flex items-center text-xs text-zinc-400 pt-2">
                        <Tooltip content={isFreePlan ? "Seu plano gratuito tem um limite mensal de gerações." : "Seu plano atual permite um número maior de gerações."}>
                            <Info className="h-4 w-4 mr-1 text-zinc-500 cursor-help" />
                        </Tooltip>
                        {getUsageMessage()}
                    </div>
                )}
            </div>
        </div>
    );
};