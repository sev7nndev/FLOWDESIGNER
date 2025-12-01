import React from 'react';
import { User, UsageData } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, LogOut, Code, User as UserIcon, Zap, Clock } from 'lucide-react';

interface DevPanelPageProps {
    user: User;
    usage: UsageData;
    onBackToApp: () => void;
    onLogout: () => Promise<void>;
}

export const DevPanelPage: React.FC<DevPanelPageProps> = ({ user, usage, onBackToApp, onLogout }) => {
    
    const renderJson = (data: any) => (
        <pre className="bg-zinc-800 p-4 rounded-lg text-xs overflow-x-auto text-green-400">
            {JSON.stringify(data, null, 2)}
        </pre>
    );

    return (
        <div className="min-h-screen bg-zinc-950 p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                    <h1 className="text-3xl font-bold flex items-center text-cyan-400">
                        <Code size={28} className="mr-2" />
                        Dev Panel
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Coluna 1: Dados do Usuário */}
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 shadow-lg space-y-4">
                        <h2 className="text-xl font-semibold flex items-center text-white border-b border-zinc-700 pb-2">
                            <UserIcon size={20} className="mr-2" /> Dados do Usuário (Profile)
                        </h2>
                        {renderJson(user)}
                    </div>

                    {/* Coluna 2: Dados de Uso */}
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 shadow-lg space-y-4">
                        <h2 className="text-xl font-semibold flex items-center text-white border-b border-zinc-700 pb-2">
                            <Zap size={20} className="mr-2" /> Dados de Uso (Credits/Generations)
                        </h2>
                        {renderJson(usage)}
                    </div>
                    
                    {/* Coluna 3: Variáveis de Ambiente (Mock) */}
                    <div className="lg:col-span-2 bg-zinc-900/50 p-6 rounded-xl border border-white/10 shadow-lg space-y-4">
                        <h2 className="text-xl font-semibold flex items-center text-white border-b border-zinc-700 pb-2">
                            <Clock size={20} className="mr-2" /> Variáveis de Ambiente (Mock)
                        </h2>
                        {renderJson({
                            VITE_SUPABASE_URL: "******",
                            VITE_SUPABASE_ANON_KEY: "******",
                            NODE_ENV: import.meta.env.MODE,
                            API_VERSION: "v1.0.0",
                            FEATURE_FLAG_NEW_UI: true,
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};