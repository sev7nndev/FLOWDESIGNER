import React from 'react';
import { User } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, LogOut, Code } from 'lucide-react';

interface DevPanelPageProps {
    user: User;
    onBackToApp: () => void;
    onLogout: () => Promise<void>;
}

export const DevPanelPage: React.FC<DevPanelPageProps> = ({ user, onBackToApp, onLogout }) => {
    return (
        <div className="min-h-screen bg-zinc-950 p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                    <h1 className="text-3xl font-bold flex items-center text-primary">
                        <Code size={28} className="mr-2" />
                        Painel de Desenvolvimento
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
                    <h2 className="text-xl font-semibold">Informações do Usuário (Dev)</h2>
                    <p>ID: {user.id}</p>
                    <p>Email: {user.email}</p>
                    <p>Role: <span className="text-yellow-400 font-medium">{user.role}</span></p>
                    
                    <div className="pt-4 border-t border-zinc-800">
                        <h3 className="text-lg font-semibold mb-2">Ferramentas de Teste</h3>
                        <p className="text-zinc-400">Aqui você pode adicionar botões para resetar créditos, forçar erros de API, etc.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};