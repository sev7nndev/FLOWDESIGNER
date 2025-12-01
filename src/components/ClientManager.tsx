import React, { useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { Loader2, CheckCircle, XCircle, PauseCircle, Edit, Save, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { useOwnerMetrics } from '../hooks/useOwnerMetrics';
import { api } from '../services/api';

interface ClientData {
    id: string;
    name: string;
    email: string;
    plan: UserRole;
    status: 'on' | 'paused' | 'cancelled';
}

const PLAN_OPTIONS: UserRole[] = ['free', 'pro', 'business'];
const STATUS_OPTIONS: ClientData['status'][] = ['on', 'paused', 'cancelled'];

interface ClientRowProps {
    client: ClientData;
    onUpdate: (clientId: string, newPlan: UserRole, newStatus: ClientData['status']) => Promise<void>;
}

const ClientRow: React.FC<ClientRowProps> = ({ client, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newPlan, setNewPlan] = useState<UserRole>(client.plan);
    const [newStatus, setNewStatus] = useState<ClientData['status']>(client.status);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (newPlan === client.plan && newStatus === client.status) {
            setIsEditing(false);
            return;
        }
        
        setIsSaving(true);
        setError(null);
        try {
            await onUpdate(client.id, newPlan, newStatus);
            setIsEditing(false);
        } catch (e: any) {
            setError(e.message || 'Falha ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusIcon = (status: ClientData['status']) => {
        switch (status) {
            case 'on': return <CheckCircle size={16} className="text-green-500" />;
            case 'paused': return <PauseCircle size={16} className="text-yellow-500" />;
            case 'cancelled': return <XCircle size={16} className="text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="grid grid-cols-6 gap-4 items-center p-3 border-b border-zinc-700/50 hover:bg-zinc-800/50 transition-colors text-sm">
            <div className="col-span-2">
                <p className="font-medium text-white">{client.name}</p>
                <p className="text-xs text-zinc-400">{client.email}</p>
            </div>
            
            {/* Plan Column */}
            <div>
                {isEditing ? (
                    <select 
                        value={newPlan} 
                        onChange={(e) => setNewPlan(e.target.value as UserRole)}
                        className="bg-zinc-700 border border-zinc-600 rounded p-1 text-white text-xs w-full"
                    >
                        {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                ) : (
                    <span className={`font-semibold capitalize ${client.plan === 'pro' ? 'text-primary' : client.plan === 'business' ? 'text-yellow-400' : 'text-zinc-400'}`}>
                        {client.plan}
                    </span>
                )}
            </div>
            
            {/* Status Column */}
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <select 
                        value={newStatus} 
                        onChange={(e) => setNewStatus(e.target.value as ClientData['status'])}
                        className="bg-zinc-700 border border-zinc-600 rounded p-1 text-white text-xs w-full"
                    >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                ) : (
                    <>
                        {getStatusIcon(client.status)}
                        <span className="capitalize text-zinc-300">{client.status}</span>
                    </>
                )}
            </div>
            
            {/* Actions Column */}
            <div className="col-span-2 text-right">
                {isEditing ? (
                    <Button 
                        size="small" 
                        variant="primary" 
                        onClick={handleSave} 
                        isLoading={isSaving}
                        icon={<Save size={14} />}
                    >
                        Salvar
                    </Button>
                ) : (
                    <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={() => setIsEditing(true)}
                        icon={<Edit size={14} />}
                    >
                        Editar
                    </Button>
                )}
            </div>
            
            {error && (
                <div className="col-span-6 text-red-400 text-xs flex items-center gap-1 mt-1">
                    <AlertTriangle size={14} /> {error}
                </div>
            )}
        </div>
    );
};


export const ClientManager: React.FC<{ owner: User }> = ({ owner }) => {
    const { metrics, isLoadingMetrics, errorMetrics, refreshMetrics } = useOwnerMetrics(owner);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateClient = useCallback(async (clientId: string, newPlan: UserRole, newStatus: ClientData['status']) => {
        setIsUpdating(true);
        try {
            await api.updateClientPlan(clientId, newPlan, newStatus);
            await refreshMetrics(); // Refresh metrics after successful update
        } catch (e) {
            setIsUpdating(false);
            throw e; // Re-throw error for ClientRow to handle
        } finally {
            setIsUpdating(false);
        }
    }, [refreshMetrics]);

    if (isLoadingMetrics) {
        return (
            <div className="text-center py-10 text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" /> Carregando métricas...
            </div>
        );
    }

    if (errorMetrics) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-500/20 text-red-400 rounded-lg">
                <AlertTriangle size={20} className="inline mr-2" /> Falha ao carregar dados: {errorMetrics}
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 shadow-lg space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Gerenciamento de Clientes</h3>
            
            <div className="grid grid-cols-6 gap-4 font-semibold text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-700 pb-2">
                <span className="col-span-2">Cliente</span>
                <span>Plano</span>
                <span>Status</span>
                <span className="col-span-2 text-right">Ações</span>
            </div>

            <div className="divide-y divide-zinc-800">
                {metrics.clients.length === 0 ? (
                    <p className="text-center py-6 text-zinc-500">Nenhum cliente encontrado.</p>
                ) : (
                    metrics.clients.map((client) => (
                        <ClientRow 
                            key={client.id} 
                            client={client as ClientData} 
                            onUpdate={handleUpdateClient} 
                        />
                    ))
                )}
            </div>
            
            {isUpdating && (
                <div className="text-center text-primary text-sm flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Atualizando cliente...
                </div>
            )}
        </div>
    );
};