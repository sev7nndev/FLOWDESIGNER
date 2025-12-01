import React, { useState } from 'react';
import { Check, X, Zap, Star, Shield, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { User } from '../types';
import { api } from '../services/api';

interface PricingPageProps {
    user: User;
    onBackToApp: () => void;
}

interface Plan {
    id: 'free' | 'starter' | 'pro';
    name: string;
    price: number;
    description: string;
    features: string[];
    isCurrent: boolean;
    isRecommended: boolean;
}

const featuresList = {
    free: [
        '5 gerações por mês',
        'Marca d\'água Flow Designer',
        'Acesso à Galeria',
        'Suporte via Chat (Prioridade Baixa)',
    ],
    starter: [
        '50 gerações por mês',
        'Sem marca d\'água',
        'Acesso ilimitado à Galeria',
        'Suporte via Chat (Prioridade Média)',
        'Geração em alta resolução (HD)',
    ],
    pro: [
        'Gerações ILIMITADAS',
        'Sem marca d\'água',
        'Acesso ilimitado à Galeria',
        'Suporte via Chat (Prioridade Alta)',
        'Geração em resolução 4K',
        'Acesso a modelos exclusivos (futuro)',
    ],
};

export const PricingPage: React.FC<PricingPageProps> = ({ user, onBackToApp }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const plans: Plan[] = [
        {
            id: 'free',
            name: 'Free',
            price: 0,
            description: 'Ideal para testar e experimentar o Flow Designer.',
            features: featuresList.free,
            isCurrent: user.role === 'free',
            isRecommended: false,
        },
        {
            id: 'starter',
            name: 'Starter',
            price: 29.99,
            description: 'Perfeito para pequenos projetos e uso pessoal.',
            features: featuresList.starter,
            isCurrent: user.role === 'starter',
            isRecommended: true,
        },
        {
            id: 'pro',
            name: 'Pro',
            price: 49.99,
            description: 'Para profissionais e agências que precisam de poder ilimitado.',
            features: featuresList.pro,
            isCurrent: user.role === 'pro',
            isRecommended: false,
        },
    ];

    const handleSubscriptionAction = async (planId: 'starter' | 'pro') => {
        if (user.role === planId) return; // Já está neste plano

        setIsLoading(true);
        setError(null);
        
        try {
            // Chama o endpoint que simula a criação da sessão do portal de faturamento
            const redirectUrl = await api.createBillingPortalSession();
            
            // Redireciona o usuário para o portal (que pode ser a página de checkout ou o portal de gerenciamento)
            window.location.href = redirectUrl;
        } catch (e: any) {
            console.error("Billing action error:", e);
            setError(e.message || 'Falha ao iniciar a ação de faturamento. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleManageSubscription = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const redirectUrl = await api.createBillingPortalSession();
            window.location.href = redirectUrl;
        } catch (e: any) {
            setError(e.message || 'Falha ao acessar o portal de gerenciamento.');
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonAction = (plan: Plan) => {
        if (plan.isCurrent) {
            return (
                <Button 
                    variant="secondary" 
                    className="w-full h-12" 
                    onClick={handleManageSubscription}
                    isLoading={isLoading}
                    disabled={isLoading}
                >
                    Gerenciar Assinatura
                </Button>
            );
        }
        
        if (plan.id === 'free') {
            return (
                <Button variant="secondary" className="w-full h-12" disabled>
                    Plano Atual
                </Button>
            );
        }
        
        // Upgrade/Downgrade
        return (
            <Button 
                variant={plan.isRecommended ? 'primary' : 'secondary'} 
                className="w-full h-12" 
                onClick={() => handleSubscriptionAction(plan.id)}
                isLoading={isLoading}
                disabled={isLoading}
            >
                {user.role === 'free' ? 'Fazer Upgrade' : 'Mudar para este Plano'}
            </Button>
        );
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-gray-100 pt-20 pb-16 relative">
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
            
            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-primary/50 pb-4 mb-12">
                    <h1 className="text-4xl font-extrabold text-white">
                        Escolha o Plano Perfeito
                    </h1>
                    <Button variant="secondary" onClick={onBackToApp} icon={<ArrowLeft size={16} />}>
                        Voltar para o App
                    </Button>
                </div>
                
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                {/* Cartões de Preços */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id} 
                            className={`p-8 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 ${
                                plan.isCurrent 
                                    ? 'bg-primary/10 border-2 border-primary' 
                                    : 'bg-zinc-900 border border-white/10 hover:border-primary/50'
                            }`}
                        >
                            {plan.isRecommended && (
                                <div className="absolute top-0 right-0 bg-primary text-black text-xs font-bold px-4 py-1 rounded-tr-2xl rounded-bl-lg">
                                    Mais Popular
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3 mb-4">
                                {plan.id === 'free' && <Shield size={28} className="text-gray-400" />}
                                {plan.id === 'starter' && <Zap size={28} className="text-blue-400" />}
                                {plan.id === 'pro' && <Star size={28} className="text-yellow-400" />}
                                <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                            </div>
                            
                            <p className="text-gray-400 mb-6">{plan.description}</p>
                            
                            <div className="mb-8">
                                <span className="text-5xl font-extrabold text-white">
                                    {plan.price === 0 ? 'Grátis' : `R$${plan.price.toFixed(2)}`}
                                </span>
                                {plan.price > 0 && <span className="text-gray-400"> / mês</span>}
                            </div>
                            
                            {/* Lista de Recursos */}
                            <ul className="space-y-3 flex-grow mb-8">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3 text-sm">
                                        <Check size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className={plan.isCurrent ? 'text-white' : 'text-gray-300'}>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            {/* Ação do Botão */}
                            <div className="mt-auto">
                                {getButtonAction(plan)}
                                {plan.isCurrent && (
                                    <p className="text-center text-xs text-primary mt-2 font-semibold">
                                        Seu plano atual.
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-16 text-center text-gray-500 text-sm">
                    <p>* Todos os planos pagos são cobrados mensalmente. Você pode cancelar a qualquer momento através do portal de gerenciamento.</p>
                </div>
            </div>
        </div>
    );
};