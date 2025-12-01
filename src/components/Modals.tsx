import React from 'react';
import { User, UserRole, UsageData } from '../types';
import { X, LogOut, Zap } from 'lucide-react';
import { Button } from './Button';

interface SettingsModalProps {
    user: User;
    profileRole: UserRole;
    usage: UsageData;
    onClose: () => void;
    onLogout: () => Promise<void>;
    onShowPricing: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    user, 
    profileRole, 
    usage, 
    onClose, 
    onLogout, 
    onShowPricing 
}) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 w-full max-w-lg rounded-xl shadow-2xl border border-zinc-700">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Configurações da Conta</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-primary">Informações do Usuário</h3>
                        <p className="text-zinc-300">Nome: {user.firstName} {user.lastName}</p>
                        <p className="text-zinc-300">E-mail: {user.email}</p>
                        <p className="text-zinc-300">Plano: <span className="capitalize font-medium">{profileRole}</span></p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-primary">Uso e Créditos</h3>
                        <p className="text-zinc-300">Créditos Restantes: <span className="font-bold text-white">{usage.credits}</span></p>
                        <p className="text-zinc-300">Gerações no Mês: {usage.generationsThisMonth}</p> {/* FIX: Accessing correct property (Error 4) */}
                        <Button variant="primary" onClick={onShowPricing} icon={<Zap size={16} />} className="mt-2">
                            Ver Planos de Upgrade
                        </Button>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-800 flex justify-end">
                    <Button variant="danger" onClick={onLogout} icon={<LogOut size={18} />}>
                        Sair da Conta
                    </Button>
                </div>
            </div>
        </div>
    );
};