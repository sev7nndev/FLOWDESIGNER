import React from 'react';
import { LogOut, Settings, Sparkles, User as UserIcon, Code } from 'lucide-react';
import { User, UserRole } from '../types';

interface AppHeaderProps {
  user: User | null;
  profileRole: UserRole;
  onLogout: () => Promise<void>;
  onShowSettings: () => void;
  onShowDevPanel: () => void; 
  children?: React.ReactNode; 
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, profileRole, onLogout, onShowSettings, onShowDevPanel, children }) => {
  // FIX: Explicitly type the Record to include all UserRole keys (Error 21)
  const roleDisplay: Record<UserRole, { name: string, color: string }> = {
    admin: { name: 'Admin', color: 'bg-red-600' },
    dev: { name: 'Dev', color: 'bg-cyan-600' },
    owner: { name: 'Owner', color: 'bg-yellow-600' }, 
    client: { name: 'Client', color: 'bg-blue-600' },
    free: { name: 'Grátis', color: 'bg-gray-500' },
    starter: { name: 'Starter', color: 'bg-blue-500' }, 
    pro: { name: 'Pro', color: 'bg-primary' },
  };

  const currentRole = roleDisplay[profileRole] || roleDisplay.free;
  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Usuário';
  const isAdminOrDev = profileRole === 'admin' || profileRole === 'dev';

  return (
    <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-[100] shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
            <Sparkles size={18} className="text-primary" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">Flow<span className="text-primary">Designer</span></span>
        </div>
        
        {/* User Actions */}
        <div className="flex items-center gap-4">
          
          {/* Children slot (for Pricing Button) */}
          {children} 

          {/* Dev Panel Button (Visible only to Admin/Dev) */}
          {isAdminOrDev && (
            <button 
              onClick={onShowDevPanel} 
              className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors rounded-lg hover:bg-white/5 border border-cyan-500/30" 
              title="Painel do Desenvolvedor"
            >
              <Code size={20} />
            </button>
          )}

          {/* User Info & Role Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
            <UserIcon size={14} className="text-gray-400" />
            <span className="text-xs text-gray-300 font-medium">
              {displayName}
            </span>
            <span className={`text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${currentRole.color}`}>
                {currentRole.name}
            </span>
          </div>

          {/* Settings Button */}
          <button 
            onClick={onShowSettings} 
            className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-white/5" 
            title="Configurações Pessoais"
          >
            <Settings size={20} />
          </button>
          
          {/* Logout Button */}
          <button 
            onClick={onLogout} 
            className="h-10 px-4 text-sm font-medium text-white bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>
    </header>
  );
};