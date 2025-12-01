import React, { useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { Settings, LogOut, Zap, Star, Shield, MessageSquare, X, User as UserIcon, DollarSign } from 'lucide-react';
import { Button } from './Button';
import { SupportChat } from './SupportChat';
import { api } from '../services/api';

interface SettingsModalProps {
    user: User;
    profileRole: UserRole;
    onClose: () => void;
    onLogout: () => Promise<void>;
    onShowPricing: () => void;
    onShowSupport: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, profileRole, onClose, onLogout, onShowPricing, onShowSupport }) => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showSupport, setShowSupport] = useState(false);

    // FIX: Added 'starter' to roleDisplay (Error 9)
    const roleDisplay: Record<UserRole, { name: string, color: string }> = { 
        admin: { name: 'Administrador', color: 'bg-red-600' },
        dev: { name: 'Desenvolvedor', color: 'bg-cyan-600' },
        owner: { name: 'Proprietário', color: 'bg-yellow-600' },
        client: { name: 'Cliente', color: 'bg-blue-600' },
        free: { name: 'Grátis', color: 'bg-gray-500' },
        starter: { name: 'Starter', color: 'bg-blue-500' }, 
        pro: { name: 'Pro', color: 'bg-primary' },
    };

    const currentRole = roleDisplay[profileRole] || roleDisplay.free;

    const handleLogout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            await onLogout();
        } catch (e) {
            console.error("Logout failed", e);
        } finally {
            setIsLoggingOut(false);
        }
    }, [onLogout]);

    const handleManageSubscription = useCallback(async () => {
        try {
            const redirectUrl = await api.createBillingPortalSession();
            window.location.href = redirectUrl;
        } catch (e) {
            alert("Falha ao acessar o portal de faturamento.");
            console.error("Billing portal error:", e);
        }
    }, []);

    return (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg border border-white/10 relative">
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings size={24} className="text-primary" /> Configurações Pessoais
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                        <X size={20} />
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="p-6 space-y-6">
                    
                    {/* Informações do Usuário */}
                    <div className="bg-zinc-800 p-4 rounded-lg border border-white/5">
                        <div className="flex items-center gap-4">
                            <UserIcon size={24} className="text-gray-400" />
                            <div>
                                <p className="text-white font-semibold">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                            <span className="text-xs text-gray-400">Seu Plano Atual:</span>
                            <span className={`text-white text-xs font-bold uppercase px-3 py-1 rounded-full ${currentRole.color}`}>
                                {currentRole.name}
                            </span>
                        </div>
                    </div>

                    {/* Botão de Gerenciamento de Assinatura */}
                    {(profileRole === 'starter' || profileRole === 'pro') && ( 
                        <div className="pt-4 border-t border-white/5">
                            <Button 
                                variant="secondary" 
                                onClick={handleManageSubscription} 
                                className="w-full"
                                icon={<DollarSign size={18} />}
                            >
                                Gerenciar Assinatura
                            </Button>
                        </div>
                    )}
                    
                    {/* Botão de Upgrade/Pricing */}
                    {(profileRole === 'free' || profileRole === 'starter') && (
                        <Button 
                            variant="primary" 
                            onClick={onShowPricing} 
                            className="w-full"
                            icon={<Zap size={18} />}
                        >
                            Fazer Upgrade
                        </Button>
                    )}

                    {/* Botão de Suporte */}
                    <Button 
                        variant="tertiary" 
                        onClick={() => setShowSupport(true)} 
                        className="w-full"
                        icon={<MessageSquare size={18} />}
                    >
                        Abrir Chat de Suporte
                    </Button>

                    {/* Botão de Logout */}
                    <Button 
                        variant="danger" 
                        onClick={handleLogout} 
                        isLoading={isLoggingOut}
                        className="w-full"
                        icon={<LogOut size={18} />}
                    >
                        Sair da Conta
                    </Button>
                </div>
            </div>
            
            {/* Modal de Suporte */}
            {showSupport && (
                <div className="fixed inset-0 z-[1001] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col border border-white/10">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <MessageSquare size={20} className="text-primary" /> Suporte
                            </h3>
                            <button onClick={() => setShowSupport(false)} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                                <X size={20} />
                            </button>
                        </div>
                        <SupportChat user={user} onClose={() => setShowSupport(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};