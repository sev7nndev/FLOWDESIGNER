import React from 'react';
import { User } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, LogOut, Crown, Users, DollarSign, Zap, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useOwnerMetrics } from '../hooks/useOwnerMetrics';
import { MetricCard } from '../components/MetricCard';
import { ClientManager } from '../components/ClientManager';

interface OwnerPanelPageProps {
    user: User;
    onBackToApp: () => void;
    onLogout: () => Promise<void>;
}

export const OwnerPanelPage: React.FC<OwnerPanelPageProps> = ({ user, onBackToApp, onLogout }) => {
    const { metrics, isLoadingMetrics, errorMetrics, refreshMetrics } = useOwnerMetrics(user);

    if (user.role !== 'owner') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
                <p className="text-red-400">Acesso negado.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                    <h1 className="text-3xl font-bold flex items-center text-yellow-400">
                        <Crown size={28} className="mr-2" />
                        Painel do Proprietário
                    </h1>
                    <div className="space-x-3">
                        <Button variant="ghost" size="small" onClick={refreshMetrics} icon={<RefreshCw size={16} />}>
                            Atualizar
                        </Button>
                        <Button variant="secondary" onClick={onBackToApp} icon={<ArrowLeft size={18} />}>
                            Voltar para o App
                        </Button>
                        <Button variant="danger" onClick={onLogout} icon={<LogOut size={18} />}>
                            Sair
                        </Button>
                    </div>
                </div>

                {isLoadingMetrics ? (
                    <div className="text-center py-10 text-zinc-400 flex items-center justify-center gap-2">
                        <Loader2 size={24} className="animate-spin" /> Carregando métricas...
                    </div>
                ) : errorMetrics ? (
                    <div className="p-4 bg-red-900/20 border border-red-500/20 text-red-400 rounded-lg">
                        <AlertTriangle size={20} className="inline mr-2" /> Falha ao carregar dados: {errorMetrics}
                    </div>
                ) : (
                    <div className="space-y-10">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard 
                                title="Receita Mensal Estimada (MRR)"
                                value={`R$ ${metrics.estimatedRevenue.toFixed(2)}`}
                                icon={<DollarSign size={24} />}
                                color="primary"
                            />
                            <MetricCard 
                                title="Total de Clientes"
                                value={metrics.clients.length}
                                icon={<Users size={24} />}
                                color="secondary"
                            />
                            <MetricCard 
                                title="Clientes Pagantes"
                                value={metrics.planCounts.pro + metrics.planCounts.business + metrics.planCounts.starter}
                                icon={<Zap size={24} />}
                                color="accent"
                            />
                        </div>

                        <ClientManager owner={user} />
                        
                        <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 shadow-lg">
                            <h3 className="text-xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">Distribuição de Planos</h3>
                            <div className="grid grid-cols-4 gap-4 text-sm text-zinc-300">
                                <div><span className="font-semibold text-primary">{metrics.planCounts.business}</span> Business</div>
                                <div><span className="font-semibold text-primary">{metrics.planCounts.pro}</span> Pro</div>
                                <div><span className="font-semibold text-primary">{metrics.planCounts.starter}</span> Starter</div>
                                <div><span className="font-semibold text-primary">{metrics.planCounts.free}</span> Free</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};