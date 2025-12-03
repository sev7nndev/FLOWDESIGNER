import React, { useMemo } from 'react';
import { User, EditablePlan } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { PricingCard } from '../components/PricingCard';

interface PlansPageProps {
    user: User | null;
    plans: EditablePlan[];
    isLoadingPlans: boolean;
    onBackToApp: () => void;
    onSelectPlan: (planId: string) => void;
}

export const PlansPage: React.FC<PlansPageProps> = ({ user, plans, isLoadingPlans, onBackToApp, onSelectPlan }) => {
    
    const freePlan = useMemo(() => plans.find(p => p.id === 'free'), [plans]);
    const starterPlan = useMemo(() => plans.find(p => p.id === 'starter'), [plans]);
    const proPlan = useMemo(() => plans.find(p => p.id === 'pro'), [plans]);

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center pt-16 pb-10 px-4 relative">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="w-full max-w-7xl relative z-10">
                <Button 
                    variant="ghost" 
                    onClick={onBackToApp} 
                    className="absolute top-4 left-0 text-gray-400 hover:text-white hidden md:flex"
                >
                    <ArrowLeft size={16} className="mr-2" /> {user ? 'Voltar ao App' : 'Voltar à Home'}
                </Button>
                
                <div className="text-center mb-16 mt-12">
                    <Sparkles size={32} className="text-primary mx-auto mb-4" />
                    <h1 className="text-4xl md:text-5xl font-bold text-white">Escolha Seu Plano</h1>
                    <p className="text-gray-400 mt-3 text-lg">
                        {user ? `Olá, ${user.firstName}! Seu plano atual é ${user.role}.` : 'Comece grátis ou libere recursos ilimitados.'}
                    </p>
                </div>

                {isLoadingPlans ? (
                    <div className="text-center py-20">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-gray-400 mt-4">Carregando planos...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-end">
                        
                        {freePlan && (
                            <PricingCard 
                                name={freePlan.display_name}
                                price="R$ 0"
                                period=""
                                description={freePlan.description}
                                buttonText={user?.role === 'free' ? 'Plano Atual' : 'Começar Grátis'}
                                features={[`${freePlan.max_images_per_month} imagens por mês`, ...freePlan.features.filter(f => !f.toLowerCase().includes('imagens'))]}
                                onClick={() => onSelectPlan('free')} 
                                disabled={user?.role === 'free'}
                            />
                        )}

                        {starterPlan && (
                            <PricingCard 
                                name={starterPlan.display_name}
                                price={`R$ ${starterPlan.price.toFixed(2)}`}
                                period="/mês"
                                description={starterPlan.description}
                                buttonText={user?.role === 'starter' ? 'Plano Atual' : 'Assinar Start'}
                                features={starterPlan.features}
                                highlight={false}
                                onClick={() => onSelectPlan('starter')} 
                                disabled={user?.role === 'starter'}
                            />
                        )}

                        {proPlan && (
                            <PricingCard 
                                name={proPlan.display_name}
                                price={`R$ ${proPlan.price.toFixed(2)}`}
                                period="/mês"
                                description={proPlan.description}
                                buttonText={user?.role === 'pro' ? 'Plano Atual' : 'Assinar Pro'}
                                features={proPlan.features}
                                highlight={true}
                                badge="Melhor Custo-Benefício"
                                onClick={() => onSelectPlan('pro')} 
                                disabled={user?.role === 'pro'}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};