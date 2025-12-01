import React from 'react';
import { User } from '../types';
import { ArrowLeft, Check, Zap } from 'lucide-react';
import { Button } from './Button';

interface PricingPageProps {
    user: User;
    onBackToApp: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ user, onBackToApp }) => {
    const plans = [
        {
            name: "Free",
            price: "R$ 0",
            credits: "10 Créditos",
            features: ["Gerações básicas", "Acesso ao histórico", "Suporte comunitário"],
            current: user.role === 'free',
        },
        {
            name: "Pro",
            price: "R$ 49/mês",
            credits: "100 Créditos/mês",
            features: ["Gerações de alta qualidade", "Prioridade na fila", "Upload de logo", "Suporte por e-mail"],
            current: user.role === 'pro',
        },
        {
            name: "Business",
            price: "R$ 199/mês",
            credits: "Créditos Ilimitados",
            features: ["Tudo no Pro", "Gerações instantâneas", "Recursos de equipe", "Suporte dedicado"],
            current: user.role === 'business', // FIX: 'business' role is now defined (Error 5)
        },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 p-8">
            <div className="max-w-6xl mx-auto">
                <Button variant="ghost" onClick={onBackToApp} icon={<ArrowLeft size={18} />} className="mb-8">
                    Voltar para o App
                </Button>

                <h1 className="text-4xl font-bold text-white mb-4 flex items-center">
                    <Zap size={32} className="text-primary mr-3" />
                    Escolha seu Plano
                </h1>
                <p className="text-zinc-400 mb-12">Desbloqueie mais gerações e recursos avançados.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div 
                            key={plan.name} 
                            className={`p-8 rounded-xl shadow-2xl transition-all duration-300 ${
                                plan.current 
                                    ? 'bg-primary/10 border-2 border-primary' 
                                    : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600'
                            }`}
                        >
                            <h2 className="text-3xl font-bold mb-2 text-white">{plan.name}</h2>
                            <p className="text-4xl font-extrabold text-primary mb-4">{plan.price}</p>
                            <p className="text-zinc-400 mb-6">{plan.credits}</p>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start text-zinc-300">
                                        <Check size={20} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button 
                                variant={plan.current ? 'secondary' : 'primary'} 
                                className="w-full"
                                disabled={plan.current}
                            >
                                {plan.current ? 'Plano Atual' : 'Selecionar Plano'}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};