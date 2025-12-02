import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { getSupabase } from './services/supabaseClient';
import { AppTitleHeader } from './components/AppTitleHeader';
import { LandingPage } from './components/LandingPage';
import { AuthScreens } from './components/AuthScreens';
import { Sparkles, Loader2 } from 'lucide-react';
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

interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

type ViewType = 'LANDING' | 'AUTH' | 'APP' | 'DEV_PANEL' | 'OWNER_PANEL' | 'CHAT';

export const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<ViewType>('LANDING');
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile(authUser?.id);
  const profileRole = (profile?.role || 'free') as UserRole;
  
  const user: User | null = authUser && profile ? {
    id: authUser.id,
    email: authUser.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    createdAt: authUser.createdAt,
    role: profileRole,
  } : null;

  const { 
    form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, downloadImage,
    usage, isLoadingUsage
  } = useGeneration(user);
  
  const { images: landingImages, isLoading: isLandingImagesLoading } = useLandingImages(profileRole);

  // Initialize auth state
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('Supabase client not initialized');
      setIsInitialized(true);
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const newAuthUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            createdAt: Date.parse(session.user.created_at) || Date.now()
          };
          setAuthUser(newAuthUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const newAuthUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          createdAt: Date.parse(session.user.created_at) || Date.now()
        };
        setAuthUser(newAuthUser);
      } else {
        setAuthUser(null);
        setView('LANDING');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load history when user is available
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, loadHistory]);

  // Handle view changes based on user role
  useEffect(() => {
    if (user && !isProfileLoading) {
      if (user.role === 'owner') {
        setView('OWNER_PANEL');
      } else if (user.role === 'admin' || user.role === 'dev') {
        setView('DEV_PANEL');
      } else {
        setView('APP');
      }
    }
  }, [user, isProfileLoading]);

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const handleAuthSuccess = () => {
    // Auth success will trigger the onAuthStateChange listener
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