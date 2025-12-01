import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useGeneration } from './hooks/useGeneration';
import { useToast } from './components/ui/use-toast';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import DevPanelPage from './pages/DevPanelPage';
import OwnerPanelPage from './pages/OwnerPanelPage';
import GenerationForm from './components/GenerationForm';
import GeneratedImageCard from './components/GeneratedImageCard';
import { Loader2 } from 'lucide-react';

// Componente de Rota Protegida
const ProtectedRoute: React.FC<{ element: React.ReactNode; allowedRoles?: string[] }> = ({
  element,
  allowedRoles,
}) => {
  const { user, isLoading, userRole, signOut } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Sessão Encerrada',
      description: 'Você foi desconectado.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionamento de Owner/Dev para seus painéis se tentarem acessar o dashboard
  if (userRole === 'owner' && window.location.pathname === '/dashboard') {
    return <Navigate to="/owner-panel" replace />;
  }
  if (userRole === 'dev' && window.location.pathname === '/dashboard') {
    return <Navigate to="/dev-panel" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redireciona para o dashboard se o usuário não tiver a permissão
    return <Navigate to="/dashboard" replace />;
  }

  // Se for o Owner Panel, passamos as props de navegação
  if (window.location.pathname === '/owner-panel') {
    return React.cloneElement(element as React.ReactElement, { 
      user, 
      onBackToApp: () => window.location.href = '/dashboard', // Redireciona para o dashboard
      onLogout: handleLogout 
    });
  }
  
  // Se for o Dev Panel, passamos as props de navegação
  if (window.location.pathname === '/dev-panel') {
    return React.cloneElement(element as React.ReactElement, { 
      user, 
      onBackToApp: () => window.location.href = '/dashboard',
      onLogout: handleLogout 
    });
  }

  return element;
};

const App: React.FC = () => {
  const { user, isLoading: isLoadingAuth, userRole, signOut } = useAuth();
  const {
    generatedImage,
    isGenerating,
    generationError,
    generateImage,
    clearGeneration,
    usage,
    isLoadingUsage,
  } = useGeneration();
  const { toast } = useToast();

  useEffect(() => {
    if (generationError) {
      toast({
        title: 'Generation Failed',
        description: generationError,
        variant: 'destructive',
      });
    }
  }, [generationError, toast]);

  const handleGenerate = (businessInfo: string) => {
    clearGeneration();
    generateImage(businessInfo);
  };
  
  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Sessão Encerrada',
      description: 'Você foi desconectado.',
    });
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Rota Protegida para o Dashboard (Usuários Padrão) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  element={
                    <div className="space-y-8 pt-8">
                      <h1 className="text-4xl font-extrabold text-center">
                        Welcome, {user?.email || 'User'}!
                      </h1>
                      <GenerationForm
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        usage={usage}
                        isLoadingUsage={isLoadingUsage}
                      />
                      {generatedImage && (
                        <div className="flex justify-center">
                          <GeneratedImageCard
                            imageUrl={generatedImage.url}
                            prompt={generatedImage.prompt}
                          />
                        </div>
                      )}
                    </div>
                  }
                />
              }
            />

            {/* Rotas de Painel Administrativo */}
            <Route
              path="/dev-panel"
              element={
                <ProtectedRoute
                  element={<DevPanelPage />}
                  allowedRoles={['dev', 'owner']}
                />
              }
            />
            <Route
              path="/owner-panel"
              element={
                <ProtectedRoute
                  element={<OwnerPanelPage />}
                  allowedRoles={['owner']}
                />
              }
            />

            {/* Redirecionamento padrão para usuários logados */}
            {user && <Route path="/auth" element={<Navigate to="/dashboard" replace />} />}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;