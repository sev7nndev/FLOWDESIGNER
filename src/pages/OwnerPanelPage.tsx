import React from 'react';
import { User } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, LogOut, Crown } from 'lucide-react';

interface OwnerPanelPageProps {
    user: User;
    onBackToApp: () => void;
    onLogout: () => Promise<void>;
}

export const OwnerPanelPage: React.FC<OwnerPanelPageProps> = ({ user, onBackToApp, onLogout }) => {
    return (
        <div className="min-h-screen bg-zinc-950 p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                    <h1 className="text-3xl font-bold flex items-center text-yellow-400">
                        <Crown size={28} className="mr-2" />
                        Painel do Proprietário
                    </h1>
                    <div className="space-x-3">
                        <Button variant="secondary" onClick={onBackToApp} icon={<ArrowLeft size={18} />}>
                            Voltar para o App
                        </Button>
                        <Button variant="danger" onClick={onLogout} icon={<LogOut size={18} />}>
                            Sair
                        </Button>
                    </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
                    <h2 className="text-xl font-semibold">Informações de Administração</h2>
                    <p>ID: {user.id}</p>
                    <p>Email: {user.email}</p>
                    <p>Role: <span className="text-yellow-400 font-medium">{user.role}</span></p>
                    
                    <div className="pt-4 border-t border-zinc-800">
                        <h3 className="text-lg font-semibold mb-2">Gestão de Usuários e Faturamento</h3>
                        <p className="text-zinc-400">Aqui você pode adicionar ferramentas para gerenciar todos os usuários, planos e faturamento.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};