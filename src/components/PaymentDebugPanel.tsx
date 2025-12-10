import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { getSupabase } from '../../services/supabaseClient';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentLog {
    id: string;
    user_id: string;
    event_type: string;
    status: string;
    payload: any;
    created_at: string;
}

interface PaymentDebugPanelProps {
    userId: string; // ID of the user we want to simulate payment for (optional, or current admin context)
}

export const PaymentDebugPanel: React.FC<PaymentDebugPanelProps> = ({ userId }) => {
    const [targetEmail, setTargetEmail] = useState('');
    const [targetUserId, setTargetUserId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<PaymentLog[]>([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const supabase = getSupabase();
            const { data: { session } } = await supabase!.auth.getSession();
            
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/payment-logs`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const handleSimulatePayment = async (plan: 'starter' | 'pro' | 'free', status: 'approved' | 'rejected' = 'approved') => {
        if (!targetEmail || !targetUserId) {
            toast.error('Preencha o Email e ID do usuário alvo.');
            return;
        }

        setIsLoading(true);
        try {
            const supabase = getSupabase();
            const { data: { session } } = await supabase!.auth.getSession();

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/test-webhook`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'payment.created',
                    user_id: targetUserId,
                    email: targetEmail,
                    plan: plan,
                    status: status,
                    transaction_amount: plan === 'starter' ? 29.90 : plan === 'pro' ? 49.90 : 0
                })
            });

            if (!response.ok) throw new Error('Falha na simulação');
            
            const result = await response.json();
            toast.success(result.message);
            fetchLogs(); // Refresh logs

        } catch (error: any) {
            toast.error('Erro na simulação: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
                <ShieldCheck className="text-purple-400" />
                <div>
                    <h2 className="text-xl font-bold text-white">Sandbox de Pagamentos</h2>
                    <p className="text-sm text-gray-400">Simule webhooks do Mercado Pago sem gastar dinheiro.</p>
                </div>
            </div>

            {/* Simulation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-white">1. Configurar Alvo</h3>
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            placeholder="ID do Usuário (UUID)" 
                            value={targetUserId}
                            onChange={e => setTargetUserId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
                        />
                         <input 
                            type="email" 
                            placeholder="Email do Usuário" 
                            value={targetEmail}
                            onChange={e => setTargetEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
                        />
                        <p className="text-xs text-gray-500">* Copie o ID da lista de usuários acima.</p>
                    </div>
                </div>

                <div className="space-y-4">
                     <h3 className="font-semibold text-white">2. Disparar Evento</h3>
                     <div className="grid grid-cols-2 gap-2">
                        <Button 
                            onClick={() => handleSimulatePayment('starter', 'approved')} 
                            isLoading={isLoading}
                            className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border-green-600/50"
                        >
                            Aprovar Starter
                        </Button>
                        <Button 
                            onClick={() => handleSimulatePayment('pro', 'approved')} 
                            isLoading={isLoading}
                            className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border-purple-600/50"
                        >
                            Aprovar Pro
                        </Button>
                         <Button 
                            onClick={() => handleSimulatePayment('starter', 'rejected')} 
                            isLoading={isLoading}
                            className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-600/50"
                        >
                            Recusar Pagamento
                        </Button>
                     </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-white">Logs Recentes (Tabela: payment_logs)</h3>
                    <button onClick={fetchLogs} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                        <RefreshCw size={12} /> Atualizar
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-400">
                        <thead className="bg-white/5 uppercase font-bold text-gray-300">
                            <tr>
                                <th className="p-2">Data</th>
                                <th className="p-2">Evento</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Usuário</th>
                                <th className="p-2">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-white/5">
                                    <td className="p-2">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="p-2">{log.event_type}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-0.5 rounded-full ${
                                            log.status === 'approved' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="p-2 font-mono">{log.user_id.slice(0, 8)}...</td>
                                    <td className="p-2 max-w-[200px] truncate">{JSON.stringify(log.payload)}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-600">Nenhum log encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
