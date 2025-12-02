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
import { Toaster } from 'sonner';
import { useLocalStorage } from './hooks/useLocalStorage';

type ViewType = 'LANDING' | 'AUTH' | 'APP' | 'DEV_PANEL' | 'OWNER_PANEL' | 'CHAT';

export const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('LANDING');
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Persist view in localStorage for better UX
  const [lastView, setLastView] = useLocalStorage<ViewType>('lastView', 'LANDING');
  
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile(user?.id);
  const profileRole = (profile?.role || 'free') as UserRole;
  
  const { 
    form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, downloadImage,
    usage, isLoadingUsage
  } = useGeneration(user);
  
  const { images: landingImages, isLoading: isLandingImagesLoading } = useLandingImages(profileRole);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Check if Supabase is configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
        }
        
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          console.log('✅ User found:', currentUser.email);
          setUser(currentUser);
          setView(getInitialView(currentUser));
        } else {
          console.log('ℹ️ No user found, showing landing');
          // Restore last view if no user
          setView(lastView);
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
      console.log('🔄 Auth state changed:', authUser?.email);
      if (authUser) {
        setUser(authUser);
        const newView = getInitialView(authUser);
        setView(newView);
        setLastView(newView);
      } else {
        setUser(null);
        setView('LANDING');
        setLastView('LANDING');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to determine initial view based on user role
  const getInitialView = (currentUser: User): ViewType => {
    switch (currentUser.role) {
      case 'owner':
        return 'OWNER_PANEL';
      case 'admin':
      case 'dev':
        return 'DEV_PANEL';
      default:
        return 'APP';
    }
  };

  // Load history when user is available
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, loadHistory]);

  // Save view to localStorage when it changes
  useEffect(() => {
    if (view !== 'AUTH') { // Don't save auth view
      setLastView(view);
    }
  }, [view, setLastView]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setView('LANDING');
      setLastView('LANDING');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAuthSuccess = (authUser: User | null) => {
    if (authUser) {
      setUser(authUser);
      const newView = getInitialView(authUser);
      setView(newView);
      setLastView(newView);
    }
  };

  // Loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Sparkles size={32} className="animate-spin text-primary" />
          <p className="text-gray-400">Carregando...</p>
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
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Erro ao Inicializar
          </h2>
          
          <p className="text-gray-400 mb-6">
            {initError}
          </p>

          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Recarregar Página
            </button>
            
            <button 
              onClick={() => {
                setInitError(null);
                setIsInitialized(false);
                setTimeout(() => setIsInitialized(true), 100);
              }}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main App Component
  const MainApp = () => (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-primary/30 overflow-x-hidden relative">
      <Toaster richColors theme="dark" position="top-right" />
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
      
      <AppHeader 
        user={user} 
        profileRole={profileRole} 
        onLogout={handleLogout} 
        onShowSettings={() => setShowSettings(true)} 
        onShowDevPanel={() => setView('DEV_PANEL')}
        onShowChat={() => setView('CHAT')}
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
            />
          </div>
          <div className="lg:col-span-5">
            <ResultDisplay 
                state={state}
                downloadImage={downloadImage}
            />
          </div>
        </div>
      </main>

      {showSettings && user && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          user={user} 
          updateProfile={updateProfile} 
          profileRole={profileRole} 
        />
      )}
    </div>
  );

  // Render based on current view
  switch(view) {
    case 'LANDING':
      return (
        <LandingPage 
          onGetStarted={() => setView('AUTH')} 
          onLogin={() => setView('AUTH')} 
          landingImages={landingImages} 
          isLandingImagesLoading={isLandingImagesLoading} 
        />
      );
    case 'AUTH':
      return (
        <AuthScreens 
          onSuccess={handleAuthSuccess} 
          onBack={() => setView('LANDING')} 
        />
      );
    case 'OWNER_PANEL':
      return (
        <OwnerPanelPage 
          user={user} 
          onBackToApp={() => setView('APP')} 
          onLogout={handleLogout} 
        />
      );
    case 'DEV_PANEL':
      return (
        <DevPanelPage 
          user={user} 
          onBackToApp={() => setView('APP')} 
          onLogout={handleLogout} 
        />
      );
    case 'CHAT':
      if (!user) return <MainApp />;
      return (
        <ClientChatPanel 
          user={user} 
          onBack={() => setView('APP')} 
          onLogout={handleLogout} 
        />
      );
    case 'APP':
    default:
      return <MainApp />;
  }
};