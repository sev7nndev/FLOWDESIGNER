import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useGeneration } from './hooks/useGeneration';
import { User, UserRole, UsageData } from './types';
import { AppHeader } from './components/AppHeader';
import { SettingsModal } from './components/Modals';
import { GenerationForm } from './components/GenerationForm';
import { GenerationHistory } from './components/GenerationHistory';
import { PricingPage } from './components/PricingPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DevPanelPage } from './pages/DevPanelPage';
import { OwnerPanelPage } from './pages/OwnerPanelPage'; 
import { SupportChat } from './components/SupportChat';

// Componente de Rota Protegida
const ProtectedRoute: React.FC<{ children: React.ReactNode, isAuthenticated: boolean }> = ({ children, isAuthenticated }) => {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

const App: React.FC = () => {
    const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();
    const [showSettings, setShowSettings] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [showDevPanel, setShowDevPanel] = useState(false);
    const [showOwnerPanel, setShowOwnerPanel] = useState(false);
    const [showSupport, setShowSupport] = useState(false);

    // Determina o papel do usuário para exibição no header e lógica de acesso
    const profileRole: UserRole = user?.role || 'free';

    // Hook de Geração de Imagens
    const { 
        form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, downloadImage, // FIX: Added downloadImage (Error 15)
        usage, isLoadingUsage
    } = useGeneration(user);

    // Efeito para carregar o histórico na montagem
    useEffect(() => {
        if (isAuthenticated) {
            loadHistory();
        }
    }, [isAuthenticated, loadHistory]);

    // Lógica de navegação para painéis
    const handleShowDevPanel = useCallback(() => {
        if (profileRole === 'admin' || profileRole === 'dev') {
            setShowDevPanel(true);
        }
    }, [profileRole]);

    const handleShowOwnerPanel = useCallback(() => {
        if (profileRole === 'owner') {
            setShowOwnerPanel(true);
        }
    }, [profileRole]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    // Renderiza o painel de desenvolvedor/proprietário se estiver ativo
    if (showDevPanel) {
        return <DevPanelPage user={user} onBackToApp={() => setShowDevPanel(false)} onLogout={logout} />;
    }
    if (showOwnerPanel) {
        return <OwnerPanelPage user={user} onBackToApp={() => setShowOwnerPanel(false)} onLogout={logout} />;
    }
    if (showPricing) {
        // user é garantido ser não-null se showPricing for true (acessado do app)
        return <PricingPage user={user!} onBackToApp={() => setShowPricing(false)} />;
    }

    return (
        <Router>
            <AppHeader 
                user={user}
                profileRole={profileRole}
                onLogout={logout}
                onShowSettings={() => setShowSettings(true)}
                onShowDevPanel={handleShowDevPanel}
            >
                {/* Botão de Pricing no Header */}
                {profileRole !== 'pro' && (
                    <Button variant="primary" size="small" onClick={() => setShowPricing(true)}>
                        Upgrade
                    </Button>
                )}
            </AppHeader>

            {showSettings && user && (
                <SettingsModal 
                    user={user}
                    profileRole={profileRole}
                    onClose={() => setShowSettings(false)}
                    onLogout={logout}
                    onShowPricing={() => { setShowSettings(false); setShowPricing(true); }}
                    onShowSupport={() => { setShowSettings(false); setShowSupport(true); }}
                />
            )}
            
            {showSupport && user && (
                <div className="fixed inset-0 z-[1001] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col border border-white/10">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Suporte</h3>
                            <button onClick={() => setShowSupport(false)} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">X</button>
                        </div>
                        <SupportChat user={user} onClose={() => setShowSupport(false)} />
                    </div>
                </div>
            )}

            <Routes>
                <Route path="/" element={isAuthenticated ? <Navigate to="/app" replace /> : <LandingPage />} />
                <Route path="/login" element={<LoginPage onLogin={login} />} />
                <Route path="/register" element={<RegisterPage onRegister={register} />} />
                
                <Route path="/app" element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <div className="flex h-full">
                            <main className="flex-grow p-4 md:p-8 overflow-y-auto custom-scrollbar">
                                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Coluna 1: Formulário de Geração */}
                                    <div className="lg:col-span-1">
                                        <GenerationForm
                                            form={form}
                                            status={state.status}
                                            error={state.error}
                                            handleInputChange={handleInputChange}
                                            handleLogoUpload={handleLogoUpload}
                                            handleGenerate={handleGenerate}
                                            loadExample={loadExample}
                                            usage={usage as UsageData} // FIX: Assert usage as non-null (Error 16)
                                            isLoadingUsage={isLoadingUsage}
                                        />
                                    </div>
                                    
                                    {/* Coluna 2/3: Imagem Atual e Histórico */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <GenerationHistory 
                                            currentImage={state.currentImage} 
                                            history={state.history} 
                                            isLoading={state.status === 'IDLE' && state.history.length === 0}
                                            downloadImage={downloadImage}
                                        />
                                    </div>
                                </div>
                            </main>
                        </div>
                    </ProtectedRoute>
                } />
                
                {/* Rotas de Painel (Acesso restrito) */}
                <Route path="/dev-panel" element={<Navigate to="/app" replace />} />
                <Route path="/owner-panel" element={<Navigate to="/app" replace />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

export default App;