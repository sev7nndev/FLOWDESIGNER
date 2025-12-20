import React, { useState } from 'react';
import { LogOut, Settings, Sparkles, User as UserIcon, Code, Zap, AlertTriangle, CreditCard, Menu, X } from 'lucide-react';
import { User, UserRole, QuotaStatus } from '../../types';

interface AppHeaderProps {
  user: User | null;
  profileRole: UserRole;
  onLogout: () => void;
  onShowSettings: () => void;
  onShowDevPanel: () => void;
  onShowPlans: () => void;
  onShowSaaSPanel: () => void;
  quotaStatus: QuotaStatus;
  currentUsage: number;
  maxImages: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, profileRole, onLogout, onShowSettings, onShowDevPanel, onShowPlans, onShowSaaSPanel, quotaStatus, currentUsage, maxImages }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const roleDisplay: Record<UserRole, { name: string, color: string }> = {
    admin: { name: 'Admin', color: 'bg-red-600' },
    dev: { name: 'Dev', color: 'bg-cyan-600' },
    owner: { name: 'Owner', color: 'bg-purple-800' },
    client: { name: 'Client', color: 'bg-blue-600' },
    free: { name: 'Grátis', color: 'bg-gray-500' },
    starter: { name: 'Starter', color: 'bg-yellow-600' },
    pro: { name: 'Pro', color: 'bg-primary' },
  };

  const currentRole = roleDisplay[profileRole] || roleDisplay.free;
  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Usuário';
  const isAdminOrDev = profileRole === 'admin' || profileRole === 'dev';
  const isOwner = profileRole === 'owner' || profileRole === 'admin';

  const isNearLimit = quotaStatus === QuotaStatus.NEAR_LIMIT;
  const isBlocked = quotaStatus === QuotaStatus.BLOCKED;

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-[100] shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3 z-[250]">
          <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
            <Sparkles size={18} className="text-primary" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">Flow<span className="text-primary">Designer</span></span>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden z-[250] p-2 text-gray-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">

          <button
            onClick={onShowPlans}
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all text-sm font-medium ${isBlocked ? 'bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30' :
              isNearLimit ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 hover:bg-yellow-600/30' :
                'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
              }`}
          >
            {isBlocked ? <AlertTriangle size={16} /> : <Zap size={16} />}
            <span>{isBlocked ? 'Limite!' : isNearLimit ? 'Quase no Limite' : 'Meu Plano'}</span>
            <span className="text-xs font-bold ml-1">
              {(profileRole === 'dev' || profileRole === 'owner') ? '∞' : `${currentUsage}/${maxImages}`}
            </span>
          </button>

          {isOwner && (
            <button
              onClick={onShowSaaSPanel}
              className="p-2 text-purple-400 hover:text-purple-300 transition-colors rounded-lg hover:bg-white/5 border border-purple-500/30"
              title="Painel do Dono (SaaS)"
            >
              <CreditCard size={20} />
            </button>
          )}

          {isAdminOrDev && (
            <button
              onClick={onShowDevPanel}
              className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors rounded-lg hover:bg-white/5 border border-cyan-500/30"
              title="Painel do Desenvolvedor"
            >
              <Code size={20} />
            </button>
          )}

          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
            <UserIcon size={14} className="text-gray-400" />
            <span className="text-xs text-gray-300 font-medium">{displayName}</span>
            <span className={`text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${currentRole.color}`}>
              {currentRole.name}
            </span>
          </div>

          <button onClick={onShowSettings} className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-white/5">
            <Settings size={20} />
          </button>

          <button onClick={onLogout} className="h-9 px-4 text-sm font-medium text-white bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2">
            <LogOut size={16} /> Sair
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-zinc-950 backdrop-blur-3xl z-[200] flex flex-col pt-24 px-6 md:hidden animate-fade-in border-t border-white/10"
            style={{ backgroundColor: 'rgba(9, 9, 11, 0.98)' }}
          >
            <div className="flex flex-col gap-4">

              <div className="flex items-center gap-3 pb-6 border-b border-white/10">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <UserIcon size={24} className="text-gray-300" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{displayName}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${currentRole.color} text-white`}>
                    {currentRole.name}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { onShowPlans(); closeMenu(); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${isBlocked ? 'bg-red-900/20 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-white'}`}
                >
                  <Zap size={24} className="mb-2" />
                  <span className="text-sm font-bold">Plano: {(profileRole === 'dev' || profileRole === 'owner') ? '∞' : `${currentUsage}/${maxImages}`}</span>
                </button>

                <button
                  onClick={() => { onShowSettings(); closeMenu(); }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 transition-all active:scale-95"
                >
                  <Settings size={24} className="mb-2" />
                  <span className="text-sm font-bold">Configurações</span>
                </button>
              </div>

              {(isOwner || isAdminOrDev) && (
                <div className="space-y-2 mt-2">
                  {isOwner && (
                    <button onClick={() => { onShowSaaSPanel(); closeMenu(); }} className="w-full p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 text-purple-300 flex items-center gap-3">
                      <CreditCard size={20} /> Painel SaaS
                    </button>
                  )}
                  {isAdminOrDev && (
                    <button onClick={() => { onShowDevPanel(); closeMenu(); }} className="w-full p-4 rounded-xl bg-cyan-900/20 border border-cyan-500/30 text-cyan-300 flex items-center gap-3">
                      <Code size={20} /> Painel Dev
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={onLogout}
                className="w-full mt-auto mb-8 p-4 bg-red-600/10 border border-red-600/30 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <LogOut size={20} /> Sair da Conta
              </button>

            </div>
          </div>
        )}
      </div>
    </header>
  );
};