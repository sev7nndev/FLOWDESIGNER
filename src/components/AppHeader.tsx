import React from 'react';
import { User, UserRole } from '../types';
import { Settings, LogOut, Code, Crown } from 'lucide-react';
import { Button } from './Button';

interface AppHeaderProps {
    user: User;
    profileRole: UserRole;
    onLogout: () => Promise<void>;
    onShowSettings: () => void;
    onShowDevPanel: () => void;
    children?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
    user, 
    profileRole, 
    onLogout, 
    onShowSettings, 
    onShowDevPanel,
    children
}) => {
    const isAdminOrDev = profileRole === 'admin' || profileRole === 'dev';
    const isOwner = profileRole === 'owner';

    return (
        <header className="bg-zinc-900 border-b border-zinc-800 shadow-lg sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-primary">Flow Designer</h1>
                    <span className="text-sm text-zinc-400 hidden sm:inline">Bem-vindo, {user.firstName}</span>
                </div>

                <div className="flex items-center space-x-3">
                    {children} {/* Pricing Button */}

                    {/* Admin/Dev Panel Button */}
                    {(isAdminOrDev || isOwner) && (
                        <Button 
                            variant="secondary" 
                            size="small" 
                            onClick={onShowDevPanel} 
                            icon={isOwner ? <Crown size={16} /> : <Code size={16} />}
                        >
                            {isOwner ? 'Owner Panel' : 'Dev Panel'}
                        </Button>
                    )}

                    {/* Settings Button */}
                    <Button variant="ghost" size="small" onClick={onShowSettings} icon={<Settings size={18} />}>
                        Configurações
                    </Button>

                    {/* Logout Button */}
                    <Button variant="danger" size="small" onClick={onLogout} icon={<LogOut size={18} />}>
                        Sair
                    </Button>
                </div>
            </div>
        </header>
    );
};