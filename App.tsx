import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole } from './types';
import { getSupabase } from './services/supabaseClient';
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
import { OwnerPanelPage } from './pages/OwnerPanelPage'; // Importando o novo painel
import { Session } from '@supabase/supabase-js'; // Import Session type

// Define a minimal structure for the authenticated user before profile is loaded
interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

export const App: React.FC = () => {
  // Auth State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'LANDING' | 'AUTH' | 'APP' | 'DEV_PANEL' | 'OWNER_PANEL'>('LANDING'); // Adicionando OWNER_PANEL
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Profile Hook
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile(authUser?.id);

  // Combined User State (passed to hooks/components)
  const profileRole = (profile?.role || 'free') as UserRole;
  
  const user: User | null = useMemo(() => {
    if (!authUser || !profile) return null;
    
    return {
      id: authUser.id,
      email: authUser.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      createdAt: authUser.createdAt,
      role: profileRole, // Add role to user object
    };
  }, [authUser, profile, profileRole]); // Dependencies for memoization

  // Generation Logic Hook
  const { 
    form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, downloadImage,
    usage, isLoadingUsage // NOVOS: Quota e Status de Uso
  } = useGeneration(user);
  
  // Landing Images Hook (Used by LandingPage and DevPanel)
  const { images: landingImages, isLoading: isLandingImagesLoading } = useLandingImages(profileRole);


  const fetchAuthUser = (supabaseUser: any) => {
    const newAuthUser: AuthUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      createdAt: Date.parse(supabaseUser.created_at) || Date.now()
    };
    setAuthUser(newAuthUser);
    
    // Redirecionamento baseado no role após o perfil ser carregado
    if (profileRole === 'owner') {
        setView('OWNER_PANEL');
    } else if (profileRole === 'admin' || profileRole === 'dev') {
        setView('DEV_PANEL');
    } else {
        setView('APP');
    }
  };

  // Init Auth & History
  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      // Check Session
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        if (session?.user) {
          fetchAuthUser(session.user);
        } else {
          setView('LANDING');
        }
      });

      // Listen for Auth Changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
        if (session?.user) {
          fetchAuthUser(session.user);
        } else {
          setAuthUser(null);
          setView('LANDING');
        }
      });

      // Corrigindo TS18048: subscription é garantido existir aqui.
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadHistory();
      
      // Se o usuário for carregado e tiver um role especial, redireciona
      if (user.role === 'owner' && view !== 'OWNER_PANEL') {
          setView('OWNER_PANEL');
      } else if ((user.role === 'admin' || user.role === 'dev') && view !== 'DEV_PANEL') {
          setView('DEV_PANEL');
      } else if (view !== 'APP' && user.role !== 'owner' && user.role !== 'admin' && user.role !== 'dev') {
          setView('APP');
      }
    }
  }, [user, loadHistory, view]);

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setAuthUser(null);
    setView('LANDING');
  };

  // Show loading state while profile is being fetched after successful authentication
  if (view !== 'LANDING' && view !== 'AUTH' && !user && authUser && isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Sparkles size={32} className="animate-spin text-primary" />
      </div>
    );
  }
  
  // --- RENDER VIEWS ---

  if (view === 'LANDING') {
    return (
      <LandingPage 
        onGetStarted={() => setView('AUTH')} 
        onLogin={() => setView('AUTH')} 
        landingImages={landingImages}
        isLandingImagesLoading={isLandingImagesLoading}
      />
    );
  }

  if (view === 'AUTH') {
    return <AuthScreens onSuccess={() => {}} onBack={() => setView('LANDING')} />;
  }
  
  if (view === 'OWNER_PANEL') {
      return <OwnerPanelPage user={user} onBackToApp={() => setView('APP')} onLogout={handleLogout} />;
  }
  
  if (view === 'DEV_PANEL') {
    // Pass user directly, DevPanelPage will handle access check internally
    return <DevPanelPage user={user} onBackToApp={() => setView('APP')} onLogout={handleLogout} />;
  }
  
  // MAIN APP UI (Protected)
  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-primary/30 overflow-x-hidden relative">
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
      
      <AppHeader 
        user={user} 
        profileRole={profileRole} 
        onLogout={handleLogout} 
        onShowSettings={() => setShowSettings(true)} 
        onShowDevPanel={() => setView('DEV_PANEL')}
      />

      <div className="relative z-10 -mt-8 md:-mt-10">
        <AppTitleHeader />
      </div>

      {/* Margem negativa ajustada para o novo LampHeader mais simples */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-24 relative z-20 mt-[-2rem] md:mt-[-4rem] p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Coluna 1: Formulário de Geração */}
          <div className="lg:col-span-7">
            <GenerationForm 
                form={form}
                status={state.status}
                error={state.error}
                handleInputChange={handleInputChange}
                handleLogoUpload={handleLogoUpload}
                handleGenerate={handleGenerate}
                loadExample={loadExample}
                usage={usage} // PASSANDO O USO
                isLoadingUsage={isLoadingUsage} // PASSANDO O STATUS DE CARREGAMENTO
            />
          </div>

          {/* Coluna 2: Resultado e Histórico */}
          <div className="lg:col-span-5">
            <ResultDisplay 
                state={state}
                downloadImage={downloadImage}
                showGallery={showGallery}
                setShowGallery={setShowGallery}
            />
          </div>
        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} updateProfile={updateProfile} profileRole={profileRole} />}
    </div>
  );
};