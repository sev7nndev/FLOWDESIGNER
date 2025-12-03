import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { authService } from './services/authService';
import { AppTitleHeader } from './components/AppTitleHeader';
import { LandingPage } from './components/LandingPage';
import { AuthScreens } from './components/AuthScreens';
import { Sparkles } from 'lucide-react';
import { useGeneration } from './hooks/useGeneration';
import { ResultDisplay } from './components/ResultDisplay';
import { SettingsModal } from './components/Modals';
import { useProfile } from './hooks/useProfile';
import { GenerationForm } from './components/GenerationForm';
import { AppHeader } from './components/AppHeader';
import { useLandingImages } from './hooks/useLandingImages';
import { DevPanelPage } from './pages/DevPanelPage';
import { OwnerPanelPage } from './pages/OwnerPanelPage';
import { ClientChatPanel } from './components/ClientChatPanel';
import { toast } from 'sonner';
import { useLocalStorage } from './hooks/useLocalStorage';
import { api } from './services/api';
import { SupabaseTest } from './components/SupabaseTest';

type ViewType = 'LANDING' | 'AUTH' | 'APP' | 'DEV_PANEL' | 'OWNER_PANEL' | 'CHAT';

export const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('LANDING');
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showTest, setShowTest] = useState(true); // Mostrar teste inicialmente
  
  const [lastView, setLastView] = useLocalStorage<ViewType>('lastView', 'LANDING');
  
  const { updateProfile } = useProfile(user?.id);
  const profileRole = (user?.role || 'free') as UserRole;
  
  const { 
    form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, downloadImage,
    usage, isLoadingUsage
  } = useGeneration(user);
  
  const { images: landingImages, isLoading: isLandingImagesLoading } = useLandingImages(profileRole);

  // Helper function to determine the correct view based on user's role
  const getRoleBasedView = (role: UserRole): ViewType => {
    console.log('🎯 Determining view for role:', role);
    
    switch (role) {
      case 'owner':
        console.log('👑 Redirecting to OWNER_PANEL');
        return 'OWNER_PANEL';
      case 'admin':
      case 'dev':
        console.log('👨‍💻 Redirecting to DEV_PANEL');
        return 'DEV_PANEL';
      default:
        console.log('👤 Redirecting to APP');
        return 'APP';
    }
  };

  // 1. Initialization and Auth Listener
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const planFromUrl = urlParams.get('plan');
        const paymentStatus = urlParams.get('status');

        // Se retornar do Mercado Pago com sucesso, forçamos a tela de AUTH
        if (planFromUrl && paymentStatus === 'success') {
          console.log(`✅ Pagamento aprovado para o plano: ${planFromUrl}. Redirecionando para cadastro.`);
          setView('AUTH');
        } else {
          // Check current session
          console.log('🔍 Checking current session...');
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            console.log('✅ User found:', currentUser.email, 'Role:', currentUser.role);
            setUser(currentUser);
            // Define a view baseada no role imediatamente
            const roleView = getRoleBasedView(currentUser.role);
            setView(roleView);
            setLastView(roleView);
          } else {
            console.log('👤 No user session, showing landing');
            setView('LANDING');
          }
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        setInitError(error instanceof Error ? error.message : 'Erro ao inicializar aplicação');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = authService.onAuthStateChange((authUser) => {
      console.log('🔄 Auth state changed:', authUser?.email, authUser?.role);
      
      if (authUser) {
        console.log('✅ User authenticated, setting user state');
        setUser(authUser);
        // Define a view baseada no role imediatamente
        const roleView = getRoleBasedView(authUser.role);
        setView(roleView);
        setLastView(roleView);
      } else {
        console.log('👤 User logged out, clearing state');
        setUser(null);
        setView('LANDING');
        setLastView('LANDING');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Redirection Effect (Simplified and more robust)
  useEffect(() => {
    // Só prosseguimos se o app estiver inicializado e o objeto user (com a role) estiver disponível
    if (isInitialized && user && user.role) {
      const roleView = getRoleBasedView(profileRole);
      
      // Redireciona se estiver atualmente em LANDING, AUTH, ou se a visualização atual estiver incorreta para a função
      const shouldRedirect = view === 'LANDING' || view === 'AUTH' || (view !== 'CHAT' && view !== roleView);
      
      if (shouldRedirect) {
        console.log(`🔄 Redirecting user ${user.id} (Role: ${profileRole}) from ${view} to ${roleView}`);
        setView(roleView);
        setLastView(roleView);
      }
      
      // Carrega o histórico uma vez autenticado
      if (roleView === 'APP') {
        loadHistory();
      }
    } else if (isInitialized && !user) {
      // Se o usuário sair ou não estiver autenticado, garante que estamos em LANDING ou AUTH
      if (view !== 'AUTH' && view !== 'LANDING') {
        console.log('👤 No user, redirecting to LANDING');
        setView('LANDING');
      }
    }
  }, [isInitialized, user, profileRole, view, setLastView, loadHistory]);

  // 3. Save view to localStorage when it changes
  useEffect(() => {
    if (view !== 'AUTH') { // Não salva a visualização de autenticação
      setLastView(view);
    }
  }, [view, setLastView]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      // O listener de mudança de estado lida com o resto
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAuthSuccess = (authUser: User | null) => {
    if (authUser) {
      console.log('✅ Auth successful, setting user:', authUser.email, authUser.role);
      setUser(authUser);
      // Define a view baseada no role imediatamente
      const roleView = getRoleBasedView(authUser.role);
      setView(roleView);
      setLastView(roleView);
      // Limpa a URL para remover parâmetros de pagamento
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handlePlanSelection = async (planId: string) => {
    if (planId === 'free') {
      console.log('🆓 Free plan selected, redirecting to auth');
      setView('AUTH');
      return;
    }

    const toastId = toast.loading('Redirecionando para o pagamento...');
    
    try {
      // A returnUrl é a URL para onde o Mercado Pago deve redirecionar após o pagamento.
      // Usa a porta correta do frontend (5173) em vez de 3000
      const returnUrl = `${window.location.origin}/`; 
      
      const checkoutUrl = await api.createPaymentPreference(planId, returnUrl);
      
      toast.success('Tudo pronto! Abrindo checkout seguro.', { id: toastId });
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Failed to create payment preference:', error);
      toast.error(error.message || 'Não foi possível iniciar o pagamento. Tente novamente.', { id: toastId });
    }
  };

  // Loading state (Initial or Profile Loading)
  // Verificamos se o objeto user está presente E se a role está populada
  if (!isInitialized || (user && !user.role)) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Sparkles size={32} className="animate-spin text-primary" />
          <p className="text-gray-400">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md w-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Erro ao Inicializar</h2>
          <p className="text-gray-400 mb-6">{initError}</p>
          <div className="space-y-3">
            <button onClick={() => window.location.reload()} className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors">
              Recarregar Página
            </button>
            <button onClick={() => { setInitError(null); setIsInitialized(false); setTimeout(() => setIsInitialized(true), 100); }} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const MainApp = () => (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-primary/30 overflow-x-hidden relative">
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
      <AppHeader 
        user={user} 
        profileRole={profileRole} 
        onLogout={handleLogout} 
        onShowSettings={() => setShowSettings(true)} 
        onShowDevPanel={() => {
          console.log('👨‍💻 Manual navigation to DEV_PANEL');
          setView('DEV_PANEL');
        }} 
        onShowChat={() => {
          console.log('💬 Manual navigation to CHAT');
          setView('CHAT');
        }} 
      />
      <div className="relative z-10 -mt-8 md:-mt-10">
        <AppTitleHeader />
      </div>
      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-24 relative z-20 mt-[-2rem] md:mt-[-4rem] p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <GenerationForm 
              form={form} 
              status={state.status} 
              error={state.error} 
              handleInputChange={handleInputChange} 
              handleLogoUpload={handleLogoUpload} 
              handleGenerate={handleGenerate} 
              loadExample={loadExample} 
              usage={usage} 
              isLoadingUsage={isLoadingUsage} 
              onPlanSelect={handlePlanSelection} 
            />
          </div>
          <div className="lg:col-span-5">
            <ResultDisplay state={state} downloadImage={downloadImage} />
          </div>
        </div>
      </main>
      {showSettings && user && (
        <SettingsModal onClose={() => setShowSettings(false)} user={user} updateProfile={updateProfile} profileRole={profileRole} />
      )}
    </div>
  );

  const renderView = () => {
    console.log('🎬 Rendering view:', view, 'User role:', profileRole);
    
    switch(view) {
      case 'LANDING':
        return (
          <>
            {showTest && <SupabaseTest />}
            <LandingPage 
              onGetStarted={() => setView('AUTH')} 
              onPlanSelect={handlePlanSelection} 
              onLogin={() => setView('AUTH')} 
              landingImages={landingImages} 
              isLandingImagesLoading={isLandingImagesLoading} 
            />
          </>
        );
      case 'AUTH':
        return (
          <>
            {showTest && <SupabaseTest />}
            <AuthScreens onSuccess={handleAuthSuccess} onBack={() => setView('LANDING')} />
          </>
        );
      case 'OWNER_PANEL':
        return <OwnerPanelPage user={user} onBackToApp={() => setView('APP')} onLogout={handleLogout} />;
      case 'DEV_PANEL':
        return <DevPanelPage user={user} onBackToApp={() => setView('APP')} onLogout={handleLogout} />;
      case 'CHAT':
        if (!user) return <MainApp />;
        return <ClientChatPanel user={user} onBack={() => setView('APP')} onLogout={handleLogout} />;
      case 'APP':
      default:
        return <MainApp />;
    }
  };

  return renderView();
};