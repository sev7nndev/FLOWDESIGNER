import React, { useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { UserRole } from './types';

// Componente de Rota Protegida
const ProtectedRoute: React.FC<{ element: React.ReactNode; allowedRoles?: UserRole[] }> = ({
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

  const role = userRole as UserRole;

  // Redirecionamento de Owner/Dev para seus painéis se tentarem acessar o dashboard
  if (role === 'owner' && window.location.pathname === '/dashboard') {
    return <Navigate to="/owner-panel" replace />;
  }
  if (role === 'dev' && role !== 'owner' && window.location.pathname === '/dashboard') {
    return <Navigate to="/dev-panel" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redireciona para o dashboard se o usuário não tiver a permissão
    return <Navigate to="/dashboard" replace />;
  }

  // Clona o elemento e injeta as props de navegação
  const elementWithProps = React.cloneElement(element as React.ReactElement, { 
    user, 
    onBackToApp: () => window.location.href = '/dashboard',
    onLogout: handleLogout 
  });

  return elementWithProps;
};

const App: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    form,
    state,
    handleInputChange,
    handleLogoUpload,
    handleGenerate,
    loadExample,
    downloadImage,
    usage,
    isLoadingUsage,
  } = useGeneration(user);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        title: 'Generation Failed',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state.error, toast]);

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
        <Header onLogout={handleLogout} user={user} />
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
                    <DashboardPage 
                      user={user!} // Guaranteed by ProtectedRoute
                      form={form}
                      status={state.status}
                      error={state.error}
                      handleInputChange={handleInputChange}
                      handleLogoUpload={handleLogoUpload}
                      handleGenerate={handleGenerate}
                      loadExample={loadExample}
                      isGenerating={state.status === 'GENERATING' || state.status === 'THINKING'}
                      usage={usage}
                      isLoadingUsage={isLoadingUsage}
                      generatedImage={state.currentImage}
                    />
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
                  allowedRoles={['dev', 'admin', 'owner']}
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