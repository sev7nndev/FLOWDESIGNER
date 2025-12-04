import React, { useState, useCallback, useEffect } from 'react';
import { DollarSign, Loader2, AlertTriangle, Link, Unlink, CheckCircle2, Info } from 'lucide-react';
import { Button } from '../Button';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { getSupabase } from '@/services/supabaseClient';
import { User } from '@/types';

export const MercadoPagoManager: React.FC<{ user: User }> = ({ user }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    const isOwner = user.role === 'owner';
    const supabase = getSupabase();
    
    const checkConnectionStatus = useCallback(async () => {
        if (!isOwner || !supabase) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('owners_payment_accounts')
                .select('owner_id')
                .limit(1)
                .maybeSingle();
                
            setIsConnected(!!data);
        } catch (e: any) {
            console.error("Failed to check MP connection status:", e);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, [isOwner, supabase]);
    
    useEffect(() => {
        checkConnectionStatus();
        
        const params = new URLSearchParams(window.location.search);
        const mpStatus = params.get('mp_status');
        const message = params.get('message');
        
        if (mpStatus === 'success') {
            setStatusMessage({ type: 'success', message: 'Conexão com Mercado Pago realizada com sucesso!' });
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (mpStatus === 'error') {
            setStatusMessage({ type: 'error', message: message || 'Falha na conexão com Mercado Pago.' });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [checkConnectionStatus]);
    
    if (!isOwner) {
        return null;
    }
    
    const handleConnect = async () => {
        setIsLoading(true);
        try {
            const connectUrl = await api.getMercadoPagoConnectUrl();
            window.location.href = connectUrl;
        } catch (e: any) {
            toast.error(e.message || "Falha ao obter URL de conexão.");
            setIsLoading(false);
        }
    };
    
    const handleDisconnect = () => {
        toast.info("Para desconectar, remova manualmente o registro na tabela 'owners_payment_accounts' no Supabase.");
    };

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <DollarSign size={20} className="text-green-500" /> Integração Mercado Pago (Dono do SaaS)
            </h3>
            
            {isLoading ? (
                <div className="text-center py-4"><Loader2 size={20} className="animate-spin text-primary" /></div>
            ) : isConnected ? (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-2"><Link size={16} /> Conectado e pronto para receber pagamentos.</span>
                    <Button variant="ghost" onClick={handleDisconnect} className="h-8 text-xs text-red-400 hover:bg-red-500/10" icon={<Unlink size={14} />}>
                        Desconectar
                    </Button>
                </div>
            ) : (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-2"><AlertTriangle size={16} /> Desconectado. Conecte para receber pagamentos Starter/Pro.</span>
                    <Button onClick={handleConnect} className="h-8 text-xs" icon={<Link size={14} />}>
                        Conectar Mercado Pago
                    </Button>
                </div>
            )}
            
            {statusMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    statusMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
                    <p>{statusMessage.message}</p>
                </div>
            )}
        </div>
    );
};