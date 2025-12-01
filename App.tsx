import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useGeneration } from './hooks/useGeneration';
import { useUsage } from './hooks/useUsage';
import { AppHeader } from './components/AppHeader';
import { GenerationForm } from './components/GenerationForm';
import { GenerationHistory } from './components/GenerationHistory';
import { SettingsModal } from './components/Modals';
import { DevPanelPage } from './pages/DevPanelPage';
import { OwnerPanelPage } from './pages/OwnerPanelPage';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './components/PricingPage';
import { Button } from './components/Button';
import { Zap } from 'lucide-react';
import { UserRole, UsageData } from './types'; // Importando UsageData

const App: React.FC = () => {
  const { user, profile, isLoading: isLoadingAuth, login, register, logout } = useAuth();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [isOwnerPanelOpen, setIsOwnerPanelOpen] = useState(false);
  const [isPricingPageOpen, setIsPricingPageOpen] = useState(false);

  // Use generation hook
  const { 
    form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, // FIX: Removed downloadImage (Error 15)
    usage, isLoadingUsage
  } = useGeneration(user);

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
  
  const handleShowOwnerPanel = useCallback(() => {
    setIsOwnerPanelOpen(true);
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
          <Route path="/login" element={isAuthenticated ? <Navigate to="/app" /> : <LandingPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/app" /> : <LandingPage />} />

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
                    usage={usage as UsageData} // FIX: Cast usage to UsageData since it's null checked in useGeneration (Error 16)
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
            usage={usage}
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