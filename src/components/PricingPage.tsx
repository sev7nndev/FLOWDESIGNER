import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from './Button';
import { ArrowLeft, Check, Zap, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface PricingPageProps {
    user: User;
    onBackToApp: () => void;
}

interface Plan {
    id: UserRole;
    name: string;
    price: string;
    credits: number;
    features: string[];
    isCurrent: boolean;
    isRecommended: boolean;
}

const PLAN_DETAILS = (currentRole: UserRole): Plan[] => [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        credits: 10,
        features: ['10 gerações/mês', 'Fluxos básicos', 'Suporte comunitário'],
        isCurrent: currentRole === 'free',
        isRecommended: false,
    },
    {
        id: 'starter',
        name: 'Starter',
        price: '$19/mês',
        credits: 50,
        features: ['50 gerações/mês', 'Fluxos avançados', 'Upload de logo', 'Histórico completo'],
        isCurrent: currentRole === 'starter',
        isRecommended: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$49/mês',
        credits: 200,
        features: ['200 gerações/mês', 'Todos os recursos', 'Prioridade na fila de IA', 'Suporte por email'],
        isCurrent: currentRole === 'pro',
        isRecommended: true,
    },
    {
        id: 'business',
        name: 'Business',
        price: '$99/mês',
        credits: 500,
        features: ['500 gerações/mês', 'Uso comercial ilimitado', 'API Access (em breve)', 'Suporte dedicado'],
        isCurrent: currentRole === 'business',
        isRecommended: false,
    },
];

export const PricingPage: React.FC<PricingPageProps> = ({ user, onBackToApp }) => {
    const [loadingPlan, setLoadingPlan] = useState<UserRole | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [currentRole, setCurrentRole] = useState<UserRole>(user.role);

    const plans = PLAN_DETAILS(currentRole);

    const handleUpgrade = async (newPlan: UserRole) => {
        if (newPlan === currentRole) {
            setMessage({ type: 'error', text: 'Você já está neste plano.' });
            return;
        }
        
        if (user.role !== 'owner') {
            setMessage({ type: 'error', text: 'Apenas o Proprietário pode alterar planos no mock.' });
            return;
        }

        setLoadingPlan(newPlan);
        setMessage(null);

        try {
            await api.updateClientPlan(user.id, newPlan, 'on');
            
            setCurrentRole(newPlan);
            setMessage({ type: 'success', text: `Parabéns! Seu plano foi alterado para ${newPlan.toUpperCase()}.` });
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Falha ao processar o upgrade.' });
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-4">
                    <h1 className="text-4xl font-extrabold flex items-center text-primary">
                        <Zap size={32} className="mr-3" />
                        Escolha seu Plano
                    </h1>
                    <Button variant="secondary" onClick={onBackToApp} icon={<ArrowLeft size={18} />}>
                        Voltar para o App
                    </Button>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id} 
                            className={`
                                bg-zinc-900 p-6 rounded-xl shadow-2xl transition-all duration-300 
                                ${plan.isCurrent ? 'border-4 border-primary' : 'border border-zinc-800'}
                                ${plan.isRecommended ? 'ring-2 ring-primary/50' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-bold mb-2 text-white">{plan.name}</h2>
                                {plan.isRecommended && (
                                    <span className="bg-primary text-zinc-900 text-xs font-bold px-3 py-1 rounded-full">
                                        Recomendado
                                    </span>
                                )}
                            </div>
                            
                            <p className="text-4xl font-extrabold text-primary mb-4">{plan.price}</p>
                            <p className="text-sm text-zinc-400 mb-6">{plan.credits} gerações por mês</p>

                            <ul className="space-y-3 mb-8 text-zinc-300">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start text-sm">
                                        <Check size={18} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {plan.isCurrent ? (
                                <Button variant="secondary" disabled className="w-full">
                                    Plano Atual
                                </Button>
                            ) : (
                                <Button 
                                    variant="primary" 
                                    className="w-full"
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loadingPlan !== null}
                                    icon={loadingPlan === plan.id ? <Loader2 size={18} className="animate-spin" /> : undefined}
                                >
                                    {loadingPlan === plan.id ? 'Processando...' : 'Fazer Upgrade'}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="mt-12 text-center text-zinc-500">
                    <p>*Os preços são simulados. Em um ambiente de produção, isso integraria um provedor de pagamentos (Stripe, etc.).</p>
                    <p>Usuário atual: <span className="font-semibold text-white">{user.email}</span> (Role: <span className="font-semibold text-primary">{currentRole.toUpperCase()}</span>)</p>
                </div>
            </div>
        </div>
    );
};