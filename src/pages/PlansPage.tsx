import React, { useMemo } from 'react';
import { User, EditablePlan } from '../../types';
import { Button } from '../components/Button';
import { ArrowLeft, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
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

    // Helper para formatar features, garantindo que o limite de imagens seja o primeiro item
    const formatFeatures = (plan: EditablePlan) => {
        const quotaFeature = `${plan.max_images_per_month} imagens por mês`;
        // Filtra features para remover duplicatas de quota e adiciona a quota no início
        const filteredFeatures = plan.features.filter((f: string) => !f.toLowerCase().includes('imagens'));
        return [quotaFeature, ...filteredFeatures];
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-start pt-4 pb-12 px-4 relative">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

            <div className="w-full max-w-7xl relative z-10 flex flex-col items-center">
                {/* Top Left Back Button */}
                <div className="w-full flex justify-start mb-8 pl-4 md:pl-0">
                    <Button
                        variant="ghost"
                        onClick={onBackToApp}
                        className="text-gray-400 hover:text-white flex items-center gap-2 pl-0 hover:bg-transparent transition-colors"
                    >
                        <ArrowLeft size={16} /> {user ? 'Voltar ao App' : 'Voltar à Home'}
                    </Button>
                </div>

                <div className="text-center mb-8">
                    <Sparkles size={24} className="text-primary mx-auto mb-2" />
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Escolha Seu Plano</h1>
                    <p className="text-gray-400 mt-2 text-base">
                        {user ? `Olá, ${user.firstName}! Seu plano atual é ${user.role}.` : 'Comece grátis ou libere recursos ilimitados.'}
                    </p>
                </div>

                {isLoadingPlans ? (
                    <div className="text-center py-20">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-gray-400 mt-4">Carregando planos...</p>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-20 max-w-md mx-auto p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertTriangle size={32} className="text-red-400 mx-auto mb-4" />
                        <p className="text-red-300 font-medium">Falha ao carregar os planos de preço.</p>
                        <p className="text-red-400 text-sm mt-2">Verifique se o backend está rodando e se as tabelas `plan_settings` e `plan_details` no Supabase estão preenchidas corretamente.</p>
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
                                features={formatFeatures(freePlan)}
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
                                features={formatFeatures(starterPlan)}
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
                                features={formatFeatures(proPlan)}
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