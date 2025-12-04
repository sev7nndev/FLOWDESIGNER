import React from 'react';
import { DollarSign, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { User } from '@/types';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { MetricCard } from './MetricCard';
import { UserManagement } from './UserManagement';
import { AdminChat } from './AdminChat';
import { SaasLogoManager } from './SaasLogoManager';
import { MercadoPagoManager } from './MercadoPagoManager';
import { PlanSettingsManager } from './PlanSettingsManager';
import { GeneratedImagesManager } from './GeneratedImagesManager';
import { LandingImagesManager } from './LandingImagesManager';
import { Loader2 } from 'lucide-react';

interface OwnerDashboardProps {
    user: User;
    saasLogoUrl: string | null;
    refreshConfig: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, saasLogoUrl, refreshConfig }) => {
    const { metrics, isLoadingMetrics, errorMetrics } = useAdminMetrics(user.role);
    const { adminUsers } = useAdminUsers(user.role, user.id);
    
    const formatCurrency = (value: string) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));
    };

    return (
        <div className="space-y-12">
            <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-500" /> Dashboard de Métricas (Owner)
                </h3>
                
                {isLoadingMetrics && <div className="text-center py-10"><Loader2 size={20} className="animate-spin text-green-500" /></div>}
                {errorMetrics && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{errorMetrics}</div>}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard 
                        icon={<DollarSign size={20} />} 
                        title="Faturamento Total (Mock)" 
                        value={formatCurrency(metrics.totalRevenue)} 
                        color="text-green-500" 
                    />
                    <MetricCard 
                        icon={<Users size={20} />} 
                        title="Total de Usuários" 
                        value={metrics.totalUsers} 
                        color="text-primary" 
                    />
                    <MetricCard 
                        icon={<CheckCircle2 size={20} />} 
                        title="Assinaturas Ativas" 
                        value={metrics.activeSubscriptions} 
                        color="text-cyan-500" 
                    />
                    <MetricCard 
                        icon={<AlertTriangle size={20} />} 
                        title="Assinaturas Inativas" 
                        value={metrics.inactiveSubscriptions} 
                        color="text-yellow-500" 
                    />
                </div>
            </div>
            
            <UserManagement user={user} />
            <AdminChat user={user} adminUsers={adminUsers} />
            
            <h2 className="text-2xl font-bold text-white pt-8 border-t border-white/10">Ferramentas de Configuração</h2>
            <SaasLogoManager user={user} saasLogoUrl={saasLogoUrl} refreshConfig={refreshConfig} />
            <MercadoPagoManager user={user} />
            <PlanSettingsManager />
            <GeneratedImagesManager userRole={user.role} />
            <LandingImagesManager user={user} />
        </div>
    );
};