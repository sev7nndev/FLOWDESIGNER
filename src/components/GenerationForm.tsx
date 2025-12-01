import React from 'react';
import { GenerationFormState, UsageData, GenerationStatus } from '../types'; // Import GenerationStatus
import { Button } from './Button';
import { Input } from './Input';
import { Loader2, Upload, Zap } from 'lucide-react';

interface GenerationFormProps {
    form: GenerationFormState;
    status: GenerationStatus; // FIX: Use GenerationStatus enum
    error: string | null;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGenerate: (e: React.FormEvent) => Promise<void>;
    loadExample: () => void;
    usage: UsageData;
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
    const isLoading = status === GenerationStatus.LOADING; // FIX: Use enum value
    const isFreeTier = usage.credits <= 0;

    return (
        <div className="bg-zinc-900 p-6 rounded-xl shadow-2xl border border-zinc-800 sticky top-20">
            <h2 className="text-2xl font-bold text-white mb-4">Gerador de Fluxos</h2>
            
            <div className="mb-4 p-3 bg-zinc-800 rounded-lg flex justify-between items-center">
                <p className="text-sm text-zinc-400">Créditos: 
                    <span className={`font-bold ml-1 ${isFreeTier ? 'text-red-400' : 'text-primary'}`}>
                        {isLoadingUsage ? '...' : usage.credits}
                    </span>
                </p>
                <Button variant="ghost" size="small" onClick={loadExample}>Carregar Exemplo</Button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
                
                {/* Campo 1: Descrição do Negócio */}
                <div>
                    <label htmlFor="businessInfo" className="block text-sm font-medium text-zinc-300 mb-1">
                        Descrição do Negócio (Prompt)
                    </label>
                    <textarea
                        id="businessInfo"
                        name="businessInfo"
                        rows={4}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150"
                        placeholder="Ex: Uma startup de SaaS que vende software de gestão de projetos para equipes remotas."
                        value={form.businessInfo} // FIX: Accessing correct property (Error 2)
                        onChange={handleInputChange}
                        required
                    />
                </div>

                {/* Campo 2: Logo (Upload) */}
                <div>
                    <label htmlFor="logoFile" className="block text-sm font-medium text-zinc-300 mb-1">
                        Logo (Opcional)
                    </label>
                    <div className="flex items-center space-x-2">
                        <Input
                            id="logoFile"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                        <label 
                            htmlFor="logoFile" 
                            className="flex items-center justify-center px-4 py-2 bg-zinc-700 text-white rounded-lg cursor-pointer hover:bg-zinc-600 transition-colors"
                        >
                            <Upload size={18} className="mr-2" />
                            {form.logoFile ? form.logoFile.name : 'Escolher Arquivo'}
                        </label>
                        {form.logoFile && (
                            <span className="text-sm text-zinc-400 truncate">{form.logoFile.name}</span>
                        )}
                    </div>
                </div>

                {/* Mensagens de Status/Erro */}
                {error && (
                    <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded">{error}</p>
                )}
                {isFreeTier && !isLoadingUsage && (
                    <div className="text-yellow-400 text-sm bg-yellow-900/20 p-3 rounded flex items-center">
                        <Zap size={16} className="mr-2" />
                        Você está sem créditos. Faça um upgrade para continuar gerando.
                    </div>
                )}

                {/* Botão de Geração */}
                <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-full" 
                    disabled={isLoading || isFreeTier}
                >
                    {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        'Gerar Fluxo de Design'
                    )}
                </Button>
            </form>
        </div>
    );
};