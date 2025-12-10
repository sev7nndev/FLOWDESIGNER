import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, CreditCard, Trash2, UserPlus, X, Check, AlertTriangle, Copy, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '../../services/supabaseClient';
import { MercadoPagoManager, PlanSettingsManager, SystemHealthWidget, LandingCarouselManager } from '../components/admin/AdminWidgets';

interface OwnerPanelPageProps {
    onBack: () => void;
}

interface UserData {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    created_at: string;
    images_generated: number;
}

interface PaymentData {
    id: string;
    user_id: string;
    user_email?: string;
    amount: number;
    status: string;
    paid_at: string;
    plan?: string;
}

// Updated Modal Component to accept defaultPlan
const CreateUserModal: React.FC<{ onClose: () => void; onSuccess: () => void; defaultPlan?: 'free' | 'starter' | 'pro' }> = ({ onClose, onSuccess, defaultPlan = 'starter' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [plan, setPlan] = useState<'free' | 'starter' | 'pro'>(defaultPlan);
    const [isLoading, setIsLoading] = useState(false);

    // DB Error Handling
    const [showDbError, setShowDbError] = useState(false);
    const [copied, setCopied] = useState(false);
    const sqlFix = `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;\nDROP FUNCTION IF EXISTS public.handle_new_user();`;

    const handleCopy = () => {
        navigator.clipboard.writeText(sqlFix);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Comando SQL copiado!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
            if (!token) throw new Error("Não autenticado");

            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, password, firstName, lastName, plan })
            });

            if (!response.ok) {
                const error = await response.json();

                if (error.error && (
                    error.error.includes('Database error') ||
                    error.error.includes('unexpected_failure')
                )) {
                    setShowDbError(true);
                    throw new Error("Erro de configuração do Banco de Dados.");
                }

                throw new Error(error.error || "Falha ao criar usuário");
            }

            toast.success("Usuário criado com sucesso!");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (showDbError) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-6 w-full max-w-md relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Correção Necessária</h2>
                        <p className="text-sm text-gray-400">
                            Detectamos um conflito de automação no seu banco de dados.
                            Para corrigir e liberar a criação de usuários, execute o comando abaixo no seu
                            <span className="text-white font-medium"> SQL Editor do Supabase</span>:
                        </p>
                    </div>

                    <div className="bg-black/50 border border-white/10 rounded p-4 mb-6 relative group text-left">
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
                            {sqlFix}
                        </pre>
                        <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                            title="Copiar SQL"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>

                    <Button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700">
                        Entendi, vou corrigir
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-primary" /> Criar Novo Usuário
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Nome</label>
                            <input
                                required
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm"
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Sobrenome</label>
                            <input
                                required
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Email do Cliente</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm"
                            autoComplete="new-email"
                            placeholder="exemplo@cliente.com"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Senha Temporária</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm"
                            autoComplete="new-password"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Plano Inicial</label>
                        <select value={plan} onChange={e => setPlan(e.target.value as any)} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm">
                            <option value="free">Free (Grátis)</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                        </select>
                    </div>
                    <Button type="submit" isLoading={isLoading} className="w-full mt-2">
                        Criar Conta
                    </Button>
                </form>
            </div>
        </div>
    );
};

export const OwnerPanelPage: React.FC<OwnerPanelPageProps> = ({ onBack }) => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [revenue, setRevenue] = useState({ day: 0, week: 0, month: 0, total: 0 });
    const [payments, setPayments] = useState<PaymentData[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPlanForModal, setSelectedPlanForModal] = useState<'free' | 'starter' | 'pro'>('starter');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

    const supabase = getSupabase();

    useEffect(() => {
        setIsLoading(false);

        const init = async () => {
            if (!supabase) return; // Fix TS null check

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // NEW: RPC Call (Security Definer Bypass)
                const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');

                if (roleError) console.error("RPC Role Error:", roleError);

                const userRole = roleData || 'free';

                if (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'dev') {
                    console.log("DEBUG ACCESS DENIED. Role read:", userRole);
                    toast.error(`Acesso Negado. Apenas proprietários.`);
                    return;
                }

                setCurrentUser({ ...user, role: userRole });
            } else {
                onBack(); // No user
                return;
            }

            Promise.allSettled([loadUsers(), loadRevenue()]);
        };

        init();
    }, [supabase]);

    // Notificações em tempo real
    useEffect(() => {
        if (!supabase) return;

        const profilesSubscription = supabase
            .channel('owner-notifications-profiles')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'profiles'
            }, (payload) => {
                const firstName = (payload.new as any).first_name || 'Usuário';
                toast.success(`🎉 Novo cadastro: ${firstName}`, { duration: 5000 });
                loadUsers();
            })
            .subscribe();

        const paymentsSubscription = supabase
            .channel('owner-notifications-payments')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'payments'
            }, (payload) => {
                const amount = (payload.new as any).amount || 0;
                const plan = (payload.new as any).plan || 'unknown';
                toast.success(`💰 Novo pagamento: ${formatBRL(amount)} (${plan})`, { duration: 5000 });
                loadRevenue();
            })
            .subscribe();

        return () => {
            profilesSubscription.unsubscribe();
            paymentsSubscription.unsubscribe();
        };
    }, [supabase]);

    const loadUsers = async () => {
        try {
            const token = (await supabase?.auth.getSession())?.data.session?.access_token;
            if (!token) return;

            const response = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const filteredUsers = data.users || data;
                setUsers(Array.isArray(filteredUsers) ? filteredUsers : []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            setUsers([]);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Tem certeza que deseja excluir permanentemente este usuário? Esta ação não pode ser desfeita.')) return;

        const toastId = toast.loading('Excluindo usuário...');
        try {
            const token = (await supabase?.auth.getSession())?.data.session?.access_token;
            if (!token) throw new Error("Não autenticado");

            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Falha ao excluir usuário');
            }

            toast.success('Usuário excluído com sucesso', { id: toastId });
            loadUsers(); // Refresh list
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error.message || 'Erro ao excluir usuário', { id: toastId });
        }
    };

    const loadRevenue = async () => {
        try {
            const token = (await supabase?.auth.getSession())?.data.session?.access_token;
            if (!token) return;

            const response = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load stats');

            const data = await response.json();
            if (data.revenue) setRevenue(data.revenue);
            if (data.payments) setPayments(data.payments);
        } catch (error) {
            console.error('Error loading revenue:', error);
        }
    };

    // Helper for BRL
    const formatBRL = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                            Painel Administrativo
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Visão geral do sistema e gerenciamento</p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            variant="secondary"
                            onClick={() => setActiveTab('dashboard')}
                            className={`${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-400 opacity-60'}`}
                            icon={<LayoutDashboard size={18} />}
                        >
                            Visão Geral
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setActiveTab('settings')}
                            className={`${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 opacity-60'}`}
                            icon={<Settings size={18} />}
                        >
                            Configurações
                        </Button>
                        <div className="h-10 w-px bg-white/10 mx-2"></div>
                        <Button
                            variant="danger"
                            onClick={onBack}
                            icon={<LogOut size={18} />}
                        >
                            Voltar pro App
                        </Button>
                    </div>
                </div>


                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SystemHealthWidget />

                        {/* Revenue Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-zinc-900/50 border-white/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0 pb-2">
                                        <p className="text-sm font-medium text-gray-400">Hoje</p>
                                        <div className="p-2 bg-green-500/10 rounded-full text-green-500">
                                            <CreditCard size={16} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{formatBRL(Number(revenue.day))}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-zinc-900/50 border-white/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0 pb-2">
                                        <p className="text-sm font-medium text-gray-400">Esta Semana</p>
                                        <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                                            <CreditCard size={16} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{formatBRL(Number(revenue.week))}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-zinc-900/50 border-white/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0 pb-2">
                                        <p className="text-sm font-medium text-gray-400">Este Mês</p>
                                        <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
                                            <CreditCard size={16} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{formatBRL(Number(revenue.month))}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-zinc-900/50 border-white/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0 pb-2">
                                        <p className="text-sm font-medium text-gray-400">Total Geral</p>
                                        <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-500">
                                            <CreditCard size={16} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{formatBRL(Number(revenue.total))}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Payments Table */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 bg-zinc-900/50 border-white/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-gray-400" />
                                        Transações Recentes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-3 px-4 text-gray-500">Data</th>
                                                    <th className="text-left py-3 px-4 text-gray-500">Cliente</th>
                                                    <th className="text-left py-3 px-4 text-gray-500">Valor</th>
                                                    <th className="text-right py-3 px-4 text-gray-500">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payments.slice(0, 10).map((payment) => (
                                                    <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="py-3 px-4 text-gray-400">
                                                            {new Date(payment.paid_at).toLocaleDateString('pt-BR')}
                                                        </td>
                                                        <td className="py-3 px-4 text-white">
                                                            {users.find(u => u.id === payment.user_id)?.email || payment.user_email || '...'}
                                                        </td>
                                                        <td className="py-3 px-4 text-green-400 font-medium">
                                                            {formatBRL(Number(payment.amount))}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <span className={`px-2 py-1 rounded text-xs ${payment.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                                                }`}>
                                                                {payment.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {payments.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-6 text-center text-gray-600">Nenhuma venda recente</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions / Quick Stats */}
                            <div className="space-y-6">
                                <Card className="bg-zinc-900/50 border-white/10 h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-gray-400" />
                                            Ações Rápidas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary hover:bg-primary/80 text-white font-medium transition-colors shadow-lg shadow-primary/20"
                                        >
                                            <UserPlus size={20} />
                                            Criar Novo Cliente
                                        </button>
                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                            <p className="text-sm text-gray-400 mb-1">Total de Clientes</p>
                                            <p className="text-3xl font-bold text-white">{users.length}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                        </div>

                        {/* Client Management Table (Restored) */}
                        <Card className="bg-zinc-900/50 border-white/10 mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gray-400" />
                                    Base de Clientes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 px-4 text-gray-500">Info</th>
                                                <th className="text-left py-3 px-4 text-gray-500">Plano</th>
                                                <th className="text-left py-3 px-4 text-gray-500">Uso (Mês)</th>
                                                <th className="text-right py-3 px-4 text-gray-500">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-white">{user.first_name} {user.last_name}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${user.role === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                                                            user.role === 'owner' ? 'bg-amber-500/20 text-amber-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                                <div className="h-full bg-green-500" style={{ width: `${Math.min(((user.images_generated || 0) / (user.role === 'pro' ? 50 : user.role === 'starter' ? 20 : 3)) * 100, 100)}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-gray-400">{user.images_generated || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Button variant="danger" onClick={() => handleDeleteUser(user.id)} icon={<Trash2 size={14} />} />
                                                    </td>
                                                </tr>
                                            ))}
                                            {users.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-gray-600">
                                                        Nenhum cliente encontrado
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Mercado Pago Integration */}
                        {currentUser && <MercadoPagoManager user={currentUser} />}

                        {/* Landing Page Carousel */}
                        <LandingCarouselManager />

                        {/* Plan Settings */}
                        <PlanSettingsManager />

                        {/* Payment Sandbox removed from here */}
                    </div>
                )}

                {showCreateModal && (
                    <CreateUserModal
                        defaultPlan={selectedPlanForModal}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            loadUsers();
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default OwnerPanelPage;
