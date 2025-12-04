import React from 'react';
import { Button } from '../components/Button';
import { ArrowLeft, Code, LogOut, ShieldOff } from 'lucide-react';
import { User } from '@/types';
import { OwnerDashboard } from '../components/admin/OwnerDashboard';
import { DeveloperPanel } from '../components/admin/DeveloperPanel';

interface DevPanelPageProps {
  user: User | null;
  onBackToApp: () => void;
  onLogout: () => void;
  saasLogoUrl: string | null; 
  refreshConfig: () => void; 
}

export const DevPanelPage: React.FC<DevPanelPageProps> = ({ user, onBackToApp, onLogout, saasLogoUrl, refreshConfig }) => {
    if (!user || (user.role !== 'admin' && user.role !== 'dev' && user.role !== 'owner')) {
        return (
            <div className="app-container min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-gray-100 p-4 text-center">
                <ShieldOff size={64} className="text-red-500 mb-6 opacity-50" />
                <h1 className="text-3xl font-bold text-white mb-3">Acesso Negado</h1>
                <p className="text-gray-400 mb-8">Você não tem permissão para acessar este painel.</p>
                <Button onClick={onBackToApp} icon={<ArrowLeft size={16} />}>
                    Voltar para o Aplicativo
                </Button>
            </div>
        );
    }
    
    const isOwner = user.role === 'owner';
    const panelTitle = isOwner ? 'Painel do Dono (Owner)' : 'Painel do Desenvolvedor';

    return (
        <div className="app-container min-h-screen bg-zinc-950 text-gray-100 pt-20 pb-16 relative overflow-x-hidden">
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
            
            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                
                <div className="flex items-center justify-between border-b border-primary/50 pb-4 mb-8">
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <Code size={28} className="text-primary" /> {panelTitle}
                    </h1>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={onBackToApp} icon={<ArrowLeft size={16} />}>
                            Voltar para o App
                        </Button>
                        <Button variant="danger" onClick={onLogout} icon={<LogOut size={16} />}>
                            Logout
                        </Button>
                    </div>
                </div>

                {isOwner ? (
                    <OwnerDashboard user={user} saasLogoUrl={saasLogoUrl} refreshConfig={refreshConfig} />
                ) : (
                    <DeveloperPanel user={user} saasLogoUrl={saasLogoUrl} refreshConfig={refreshConfig} />
                )}
            </div>
        </div>
    );
};