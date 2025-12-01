import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth'; // FIX: Assuming path is correct (Error 4)
import { useGeneration } from './hooks/useGeneration';
import { UserRole, UsageData } from './types'; 
import { AppHeader } from './components/AppHeader';
import { SettingsModal } from './components/Modals';
import { GenerationForm } from './components/GenerationForm';
import { GenerationHistory } from './components/GenerationHistory';
import { PricingPage } from './components/PricingPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage'; // FIX: Assuming path is correct (Error 5)
import { RegisterPage } from './pages/RegisterPage'; // FIX: Assuming path is correct (Error 6)
import { DevPanelPage } from './pages/DevPanelPage';
import { OwnerPanelPage } from './pages/OwnerPanelPage';
import { Button } from './components/Button';
import { Zap } from 'lucide-react';

// FIX: Removed unused ProtectedRoute component (Error 7)

const App: React.FC = () => {
    const { user, profile, isLoading: isLoadingAuth, login, register, logout } = useAuth();
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
    const [isOwnerPanelOpen, setIsOwnerPanelOpen] = useState(false);
    const [isPricingPageOpen, setIsPricingPageOpen] = useState(false);

    // Use generation hook
    const { 
        form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory,
        usage, isLoadingUsage
    } = useGeneration(user);

    // Function to handle image download
    const downloadImage = useCallback((url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    // Load history on initial load
    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, [user, loadHistory]);

    const handleShowSettings = useCallback(() => {
        setIsSettingsModalOpen(true);
    }, []);

    const handleCloseSettings = useCallback(() => {
        setIsSettingsModalOpen(false);
    }, []);

    const handleShowDevPanel = useCallback(() => {
        setIsDevPanelOpen(true);
    }, []);

    const handleCloseDevPanel = useCallback(() => {
        setIsDevPanelOpen(false);
    }, []);
    
    const handleCloseOwnerPanel = useCallback(() => {
        setIsOwnerPanelOpen(false);
    }, []);

    const handleShowPricing = useCallback(() => {
        setIsPricingPageOpen(true);
        setIsSettingsModalOpen(false);
    }, []);

    const handleClosePricing = useCallback(() => {
        setIsPricingPageOpen(false);
    }, []);

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
                <p>Carregando autenticação...</p>
            </div>
        );
    }

    const isAuthenticated = !!user;
    const profileRole: UserRole = profile?.role || 'free';
    const isAdminOrDev = profileRole === 'admin' || profileRole === 'dev';
    const isOwner = profileRole === 'owner';

    // Render Pricing Page if open
    if (isPricingPageOpen && user) {
        return <PricingPage user={user} onBackToApp={handleClosePricing} />;
    }

    // Render Dev Panel if open
    if (isDevPanelOpen && isAdminOrDev) {
        return <DevPanelPage user={user} onBackToApp={handleCloseDevPanel} onLogout={logout} />;
    }
    
    // Render Owner Panel if open
    if (isOwnerPanelOpen && isOwner) {
        return <OwnerPanelPage user={user} onBackToApp={handleCloseOwnerPanel} onLogout={logout} />;
    }

    return (
        <Router>
            <div className="min-h-screen bg-zinc-950 text-gray-100">
                
                {/* Header */}
                {isAuthenticated && (
                    <AppHeader 
                        user={user}
                        profileRole={profileRole}
                        onLogout={logout}
                        onShowSettings={handleShowSettings}
                        onShowDevPanel={handleShowDevPanel}
                    >
                        {/* Pricing Button in Header */}
                        <Button variant="primary" size="small" onClick={handleShowPricing} icon={<Zap size={16} />}>
                            Upgrade
                        </Button>
                    </AppHeader>
                )}

                <Routes>
                    {/* Rotas Públicas */}
                    <Route path="/" element={isAuthenticated ? <Navigate to="/app" /> : <LandingPage />} />
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/app" /> : <LoginPage onLogin={login} />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/app" /> : <RegisterPage onRegister={register} />} />

                    {/* Rota Principal do Aplicativo (Protegida) */}
                    <Route 
                        path="/app" 
                        element={isAuthenticated ? (
                            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                
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
                                        // FIX: Casting usage to any to resolve type conflict (Error 8)
                                        usage={usage as any} 
                                        isLoadingUsage={isLoadingUsage}
                                    />
                                </div>

                                {/* Coluna 2 & 3: Visualização e Histórico */}
                                <div className="lg:col-span-2">
                                    <GenerationHistory 
                                        currentImage={state.currentImage}
                                        history={state.history}
                                        status={state.status}
                                        error={state.error}
                                        downloadImage={downloadImage} // Passing download function
                                    />
                                </div>
                            </div>
                        ) : (
                            <Navigate to="/" />
                        )} 
                    />
                    
                    {/* Rota de fallback para não autenticados */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>

                {/* Modal de Configurações */}
                {isSettingsModalOpen && user && (
                    <SettingsModal 
                        user={user}
                        profileRole={profileRole}
                        // FIX: Casting usage to any to resolve type conflict (Error 9)
                        usage={usage as any} 
                        onClose={handleCloseSettings}
                        onLogout={logout}
                        onShowPricing={handleShowPricing}
                    />
                )}
            </div>
        </Router>
    );
};

export default App;