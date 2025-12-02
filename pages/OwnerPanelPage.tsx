import React, { useState } from 'react';
import { User } from '../types';
import { ArrowLeft, Users, DollarSign, CheckCircle, PauseCircle, Loader2, MessageSquare, User as UserIcon, Zap, Shield, Star, LogOut, ShieldOff, CreditCard, Link2, Link2Off } from 'lucide-react';
import { Button } from '../components/Button';
import { useOwnerMetrics } from '../hooks/useOwnerMetrics';
import { MetricCard } from '../components/MetricCard';
import { OwnerChatPanel } from '../components/OwnerChatPanel';
import { getSupabase } from '../services/supabaseClient';
import { toast } from 'sonner';

interface OwnerPanelPageProps {
  user: User | null;
  onBackToApp: () => void;
  onLogout: () => void;
}

// --- Componente de Tabela de Clientes ---
interface ClientTableProps {
  clients: any[];
  isLoading: boolean;
}

const ClientTable: React.FC<ClientTableProps> = ({ clients, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
        <Loader2 size={20} className="animate-spin mr-2" />
        Carregando clientes...
      </div>
    );
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Star size={14} className="text-yellow-400" />;
      case 'starter':
        return <Zap size={14} className="text-blue-400" />;
      case 'free':
        return <Shield size={14} className="text-gray-400" />;
      default:
        return <UserIcon size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="overflow-x-auto bg-zinc-900/50 border border-white/10 rounded-xl shadow-lg">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-zinc-800/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plano</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{client.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary capitalize">
                  {getPlanIcon(client.plan)}
                  {client.plan}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                  client.status === 'on' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {client.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {clients.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 py-10">Nenhum cliente encontrado.</p>
      )}
    </div>
  );
};

// --- Componente de Pagamentos ---
const PaymentsPanel: React.FC<{ user: User, status: string, onRefresh: () => void }> = ({ user: _user, status, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    if (!supabase) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch('/api/owner/mp-auth-url', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      
      // CORREÇÃO: Usar data.authUrl conforme retornado pelo backend
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error("Não foi possível obter a URL de autorização.");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o Mercado Pago.");
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Tem certeza que deseja desconectar sua conta do Mercado Pago? Seus clientes não poderão mais assinar.")) {
      return;
    }
    
    setIsLoading(true);
    const supabase = getSupabase();
    if (!supabase) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch('/api/owner/mp-disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        toast.success("Conta do Mercado Pago desconectada.");
        onRefresh();
      } else {
        throw new Error("Falha ao desconectar.");
      }
    } catch (error) {
      toast.error("Erro ao desconectar a conta.");
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-white/10 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
        <CreditCard size={24} className="text-primary" />
        Conexão com Mercado Pago
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        Conecte sua conta para receber pagamentos de assinaturas dos seus clientes diretamente.
      </p>
      
      {status === 'connected' ? (
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <div>
              <p className="font-semibold text-white">Conta Conectada</p>
              <p className="text-xs text-gray-400">Você está pronto para receber pagamentos.</p>
            </div>
          </div>
          <Button variant="danger" onClick={handleDisconnect} isLoading={isLoading} icon={<Link2Off size={16} />}>
            Desconectar
          </Button>
        </div>
      ) : (
        <div className="p-6 bg-zinc-800 border border-white/10 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Nenhuma conta conectada</p>
            <p className="text-xs text-gray-400">Conecte-se para começar a vender.</p>
          </div>
          <Button onClick={handleConnect} isLoading={isLoading} icon={<Link2 size={16} />}>
            Conectar Mercado Pago
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Main Owner Panel Page ---
export const OwnerPanelPage: React.FC<OwnerPanelPageProps> = ({ user, onBackToApp, onLogout }) => {
  const { metrics, isLoadingMetrics, errorMetrics, refreshMetrics } = useOwnerMetrics(user);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'chat' | 'payments'>('dashboard');

  // Conditional rendering for access control
  if (!user || user.role !== 'owner') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-gray-100 p-4 text-center">
        <ShieldOff size={64} className="text-red-500 mb-6 opacity-50" />
        <h1 className="text-3xl font-bold text-white mb-3">Acesso Negado</h1>
        <p className="text-gray-400 mb-8">Você não tem permissão para acessar o Painel do Proprietário.</p>
        <Button onClick={onBackToApp} icon={<ArrowLeft size={16} />}>
          Voltar para o Aplicativo
        </Button>
      </div>
    );
  }

  const totalClients = metrics.clients.length;
  const totalActive = metrics.statusCounts.on;
  const totalInactive = metrics.statusCounts.paused + metrics.statusCounts.cancelled;

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100 pt-20 pb-16 relative">
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        {/* Header da Página */}
        <div className="flex items-center justify-between border-b border-primary/50 pb-4 mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <DollarSign size={28} className="text-primary" />
            Painel do Dono do SaaS
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={onBackToApp} icon={<ArrowLeft size={16} />}>
              Voltar para o App
            </Button>
            <Button variant="danger" onClick={onLogout} icon={<LogOut size={16} />}>
              Logout
            </Button>
          </div>
        </div>

        {/* Navegação por Abas */}
        <div className="flex border-b border-white/10 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'clients'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Clientes ({totalClients})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'payments'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pagamentos
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {errorMetrics && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg mb-6">
            Erro ao carregar dados: {errorMetrics}
          </div>
        )}

        {isLoadingMetrics && (
          <div className="text-center py-20">
            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
            <p className="text-gray-400 mt-4">Carregando dados do painel...</p>
          </div>
        )}

        {!isLoadingMetrics && activeTab === 'dashboard' && (
          <div className="space-y-10">
            <h2 className="text-2xl font-bold text-white">Métricas de Assinatura</h2>
            
            {/* Contagem por Plano */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Plano Free"
                value={metrics.planCounts.free}
                icon={<Users size={24} />}
                color="gray"
              />
              <MetricCard
                title="Plano Starter"
                value={metrics.planCounts.starter}
                icon={<Zap size={24} />}
                color="accent"
              />
              <MetricCard
                title="Plano Pro"
                value={metrics.planCounts.pro}
                icon={<Star size={24} />}
                color="primary"
              />
            </div>

            {/* Contagem por Status */}
            <h2 className="text-2xl font-bold text-white pt-6">Status dos Planos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <MetricCard
                title="Planos Ativos (ON)"
                value={totalActive}
                icon={<CheckCircle size={24} />}
                color="primary"
              />
              <MetricCard
                title="Planos Pausados/Cancelados"
                value={totalInactive}
                icon={<PauseCircle size={24} />}
                color="red"
              />
            </div>

            <div className="pt-8">
              <Button onClick={refreshMetrics} variant="secondary" className="text-sm">
                <Loader2 size={16} className="mr-2" />
                Atualizar Dados
              </Button>
            </div>
          </div>
        )}

        {!isLoadingMetrics && activeTab === 'clients' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Gerenciamento de Clientes</h2>
            <ClientTable clients={metrics.clients} isLoading={isLoadingMetrics} />
          </div>
        )}

        {!isLoadingMetrics && activeTab === 'chat' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquare size={24} className="text-primary" />
              Chat com Clientes
            </h2>
            <OwnerChatPanel owner={user} clients={metrics.clients} />
          </div>
        )}

        {!isLoadingMetrics && activeTab === 'payments' && (
          <PaymentsPanel user={user} status={metrics.mpConnectionStatus} onRefresh={refreshMetrics} />
        )}
      </div>
    </div>
  );
};