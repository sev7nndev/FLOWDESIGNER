import React, { useState, useCallback } from 'react';
import { User, UserRole, UsageData } from '../types';
import { Settings, LogOut, X, Zap, Star, Shield, MessageSquare, Loader2, ArrowLeft, DollarSign } from 'lucide-react';
import { Button } from './Button';
import { SupportChat } from './SupportChat';
import { api } from '../services/api';

interface SettingsModalProps {
    user: User;
    profileRole: UserRole;
    usage: UsageData | null;
    onClose: () => void;
    onLogout: () => Promise<void>;
    onShowPricing: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, profileRole, usage, onClose, onLogout, onShowPricing }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'support'>('profile');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showChat, setShowChat] = useState(false);

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
        await onLogout();
        setIsLoggingOut(false);
    }, [onLogout]);

    const handleManageSubscription = async () => {
        try {
            const redirectUrl = await api.createBillingPortalSession();
            window.location.href = redirectUrl;
        } catch (e) {
            alert("Falha ao acessar o portal de faturamento. Tente novamente.");
        }
    };

    const renderProfileTab = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Informações do Perfil</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-zinc-800 p-3 rounded-lg">
                    <p className="text-gray-400">Nome Completo</p>
                    <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg">
                    <p className="text-gray-400">Email</p>
                    <p className="text-white font-medium">{user.email}</p>
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg col-span-2">
                    <p className="text-gray-400">Função/Plano</p>
                    <span className={`text-white text-sm font-bold uppercase px-3 py-1 rounded-full ${currentRole.color}`}>
                        {currentRole.name}
                    </span>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5">
                <Button 
                    variant="danger" 
                    onClick={handleLogout} 
                    isLoading={isLoggingOut}
                    className="w-full"
                    icon={<LogOut size={18} />}
                >
                    {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
                </Button>
            </div>
        </div>
    );

    const renderBillingTab = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Gerenciamento de Assinatura</h3>
            
            {usage ? (
                <div className="bg-zinc-800 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                        {profileRole === 'pro' ? <Star size={24} className="text-yellow-400" /> : <Zap size={24} className="text-blue-400" />}
                        <p className="text-lg font-semibold text-white">Plano Atual: {currentRole.name}</p>
                    </div>
                    <p className="text-sm text-gray-400">
                        {usage.max_usage === -1 ? 'Gerações Ilimitadas.' : `Limite mensal: ${usage.max_usage} gerações.`}
                    </p>
                    <p className="text-sm text-gray-400">
                        Uso atual: {usage.current_usage} gerações.
                    </p>
                </div>
            ) : (
                <div className="bg-zinc-800 p-4 rounded-lg text-gray-400 text-sm">
                    Informações de uso não disponíveis.
                </div>
            )}

            {/* Botão de Gerenciamento de Assinatura */}
            {(profileRole === 'starter' || profileRole === 'pro') && ( // FIX: UserRole now includes 'starter'
                <div className="pt-4 border-t border-white/5">
                    <Button 
                        variant="primary" 
                        onClick={handleManageSubscription}
                        className="w-full"
                        icon={<DollarSign size={18} />}
                    >
                        Gerenciar Assinatura (Portal)
                    </Button>
                </div>
            )}
            
            <div className="pt-4 border-t border-white/5">
                <Button 
                    variant="secondary" 
                    onClick={onShowPricing}
                    className="w-full"
                    icon={<ArrowLeft size={18} />}
                >
                    Ver Opções de Planos
                </Button>
            </div>
        </div>
    );

    const renderSupportTab = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Suporte ao Vivo</h3>
            <div className="h-[400px] border border-white/10 rounded-xl overflow-hidden">
                <SupportChat user={user} onClose={() => {}} />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                
                {/* Header do Modal */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Settings size={24} className="text-primary" /> Configurações
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                        <X size={24} />
                    </button>
                </div>

                {/* Conteúdo do Modal */}
                <div className="flex flex-grow overflow-hidden">
                    {/* Navegação Lateral */}
                    <div className="w-48 flex-shrink-0 border-r border-white/10 p-4 space-y-2">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                                activeTab === 'profile' ? 'bg-primary/20 text-primary' : 'text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            <Settings size={18} /> Perfil
                        </button>
                        <button 
                            onClick={() => setActiveTab('billing')}
                            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                                activeTab === 'billing' ? 'bg-primary/20 text-primary' : 'text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            <DollarSign size={18} /> Assinatura
                        </button>
                        <button 
                            onClick={() => setActiveTab('support')}
                            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                                activeTab === 'support' ? 'bg-primary/20 text-primary' : 'text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            <MessageSquare size={18} /> Suporte
                        </button>
                    </div>

                    {/* Conteúdo da Aba */}
                    <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
                        {activeTab === 'profile' && renderProfileTab()}
                        {activeTab === 'billing' && renderBillingTab()}
                        {activeTab === 'support' && renderSupportTab()}
                    </div>
                </div>
            </div>
        </div>
    );
};