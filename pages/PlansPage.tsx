import React from 'react';
import { User, EditablePlan } from '../types';
import { useUsage } from '../hooks/useUsage';
import { Button } from '../components/Button';
import { Zap, Loader2, CheckCircle2, ArrowLeft, Info } from 'lucide-react';
import { PricingCard } from '../components/PricingCard';
import { toast } from 'sonner';
import { api } from '../services/api';

interface PlansPageProps {
    user: User;
    onBackToApp: () => void;
}

export const PlansPage: React.FC<PlansPageProps> = ({ user, onBackToApp }) => {
    const { 
        plans, 
        quota, 
        isLoading, 
        error, 
        currentPlan, 
        usagePercentage, 
        currentUsage, 
        maxImages,
        refreshUsage
    } = useUsage(user.id, user.role); // PASSING user.role

    const [isSubscribing, setIsSubscribing] = React.useState(false);

    const handleSubscribe = async (planId: string) => {
        setIsSubscribing(true);
        try {
            const { paymentUrl } = await api.initiateSubscription(planId);
            
            // Redirect user to Mercado Pago
            window.location.href = paymentUrl;
            
        } catch (e: any) {
            toast.error(e.message || "Falha ao iniciar pagamento. Verifique a conexão do Mercado Pago no Painel Dev.");
        } finally {
            setIsSubscribing(false);
        }
    };
    
    const sortedPlans = plans.sort((a, b) => a.price - b.price);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }
    
    // If there is a critical error fetching quota, display the error but still show plans if available
    const showQuotaError = error && !quota;

    return (
        <div className="min-h-screen bg-zinc-950 text-gray-100 pt-20 pb-16 relative">
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
            
            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                
                {/* Header da Página */}
                <div className="flex items-center justify-between border-b border-primary/50 pb-4 mb-8">
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <Zap size={28} className="text-primary" /> Planos e Uso
                    </h1>
                    <Button variant="secondary" onClick={onBackToApp} icon={<ArrowLeft size={16} />}>
                        Voltar para o App
                    </Button>
                </div>

                {showQuotaError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-8 max-w-4xl mx-auto flex items-start gap-3">
                        <Info size={20} className="flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-white">Erro ao Carregar Uso Atual</h4>
                            <p className="text-sm mt-1">{error}</p>
                            <button onClick={refreshUsage} className="text-xs mt-2 underline hover:text-red-300">Tentar Recarregar Uso</button>
                        </div>
                    </div>
                )}

                {/* Seção de Uso Atual (Só mostra se o quota foi carregado com sucesso) */}
                {currentPlan && quota && !showQuotaError && (
                    <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/10 shadow-xl mb-12 max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <CheckCircle2 size={24} className="text-primary" /> Seu Plano Atual: <span className={`text-white text-lg font-bold uppercase px-3 py-1 rounded-full ${currentPlan.id === 'free' ? 'bg-gray-500' : currentPlan.id === 'starter' ? 'bg-yellow-600' : 'bg-primary'}`}>{currentPlan.display_name}</span>
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <p className="text-gray-400 text-sm mb-2">Imagens Usadas no Ciclo:</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-extrabold text-white">{currentUsage}</span>
                                    <span className="text-gray-500">/ {maxImages}</span>
                                </div>
                                
                                <div className="w-full bg-white/10 rounded-full h-2.5 mt-3">
                                    <div 
                                        className={`h-2.5 rounded-full transition-all duration-500 ${usagePercentage >= 80 ? 'bg-red-500' : 'bg-primary'}`} 
                                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Ciclo iniciado em: {new Date(quota.usage.cycle_start_date).toLocaleDateString()}</p>
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Benefícios do Plano</h3>
                                <ul className="space-y-2">
                                    {currentPlan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                                            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        
                        {quota.status === 'NEAR_LIMIT' && (
                            <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm rounded-lg flex items-start gap-2">
                                <Info size={16} className="flex-shrink-0 mt-0.5" />
                                <p>Atenção: Você está perto de atingir o limite de gerações do seu plano. Considere o upgrade abaixo.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Seção de Upgrade */}
                <div className="text-center mb-16">
                    <span className="text-primary text-xs font-bold uppercase tracking-widest">Investimento</span>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mt-2">Mude para um Plano Ilimitado</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-end">
                    {sortedPlans.map((plan: EditablePlan) => (
                        <PricingCard 
                            key={plan.id}
                            name={plan.display_name} // Use display_name
                            price={plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                            period={plan.price === 0 ? '' : '/mês'}
                            description={plan.description} // Use description
                            buttonText={currentPlan?.id === plan.id ? 'Plano Atual' : plan.id === 'free' ? 'Começar Grátis' : 'Assinar Agora'}
                            features={plan.features} // Use features
                            highlight={plan.id === 'pro'}
                            badge={plan.id === 'pro' ? 'Melhor Custo-Benefício' : undefined}
                            onClick={() => {
                                if (currentPlan?.id !== plan.id && plan.id !== 'free') {
                                    handleSubscribe(plan.id);
                                } else if (plan.id === 'free' && currentPlan?.id !== 'free') {
                                    toast.info("Você já está em um plano pago. Não é possível fazer downgrade automático.");
                                } else if (plan.id === 'free' && currentPlan?.id === 'free') {
                                    toast.info("Você já está no plano Grátis.");
                                }
                            }}
                            disabled={currentPlan?.id === plan.id || isSubscribing}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};