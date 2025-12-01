import React, { useState } from 'react';
import { GeneratedImage, User, GenerationStatus } from '../types';
import { GenerationForm } from '../components/GenerationForm';
import GeneratedImageCard from '../components/GeneratedImageCard';
import { UsageData } from '../hooks/useGeneration';
import { ClientChatPanel } from '../components/ClientChatPanel';
import { MessageSquare, Wand2, Loader2 } from 'lucide-react';

interface DashboardPageProps {
    user: User;
    form: any; // Usando any para simplificar a tipagem complexa de BusinessInfo
    status: GenerationStatus;
    error: string | undefined;
    handleInputChange: (field: string, value: string) => void;
    handleLogoUpload: (file: File) => void;
    handleGenerate: () => void;
    loadExample: () => void;
    isGenerating: boolean;
    usage: UsageData;
    isLoadingUsage: boolean;
    generatedImage: GeneratedImage | null;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
    user, form, status, error, handleInputChange, handleLogoUpload, handleGenerate, loadExample,
    isGenerating, usage, isLoadingUsage, generatedImage 
}) => {
    const [activeTab, setActiveTab] = useState<'generation' | 'support'>('generation');
    
    return (
        <div className="space-y-8 pt-8">
            <h1 className="text-4xl font-extrabold text-center text-white">
                Painel do Usuário
            </h1>
            
            {/* Navegação por Abas */}
            <div className="flex justify-center border-b border-white/10 mb-8">
                <button 
                    onClick={() => setActiveTab('generation')}
                    className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'generation' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                >
                    <Wand2 size={16} /> Geração de Arte
                </button>
                <button 
                    onClick={() => setActiveTab('support')}
                    className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'support' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                >
                    <MessageSquare size={16} /> Suporte
                </button>
            </div>

            {activeTab === 'generation' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Coluna 1: Formulário de Geração */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Descreva seu Pedido</h2>
                        <GenerationForm 
                            form={form}
                            status={status}
                            error={error}
                            handleInputChange={handleInputChange}
                            handleLogoUpload={handleLogoUpload}
                            handleGenerate={handleGenerate}
                            loadExample={loadExample}
                            usage={usage}
                            isLoadingUsage={isLoadingUsage}
                        />
                    </div>
                    
                    {/* Coluna 2: Resultado */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Resultado</h2>
                        {isGenerating && (
                            <div className="p-6 bg-zinc-900/90 border border-white/10 rounded-3xl h-64 flex items-center justify-center">
                                <Loader2 size={32} className="animate-spin text-primary" />
                                <p className="text-gray-500 ml-3">Gerando arte...</p>
                            </div>
                        )}
                        {!isGenerating && generatedImage && (
                            <GeneratedImageCard
                                imageUrl={generatedImage.url}
                                prompt={generatedImage.prompt}
                            />
                        )}
                        {!isGenerating && !generatedImage && (
                            <div className="p-6 bg-zinc-900/90 border border-white/10 rounded-3xl h-64 flex items-center justify-center">
                                <p className="text-gray-500">Aguardando geração...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'support' && (
                <div className="max-w-4xl mx-auto">
                    <ClientChatPanel user={user} />
                </div>
            )}
        </div>
    );
};

export default DashboardPage;