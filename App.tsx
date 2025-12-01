import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole } from './types';
import { getSupabase } from './services/supabaseClient';
import { AppTitleHeader } from './components/AppTitleHeader';
import { LandingPage } from './components/LandingPage';
import { AuthScreens } from './components/AuthScreens';
import { Sparkles, MessageSquare, DollarSign, X } from 'lucide-react'; // Importando X
import { useGeneration } from './hooks/useGeneration';
import { ResultDisplay } from './components/ResultDisplay';
import { SettingsModal } from './components/Modals';
import { useProfile } from './hooks/useProfile';
import { GenerationForm } from './components/GenerationForm';
import { AppHeader } from './components/AppHeader';
import { useLandingImages } from './hooks/useLandingImages';
import { DevPanelPage } from './pages/DevPanelPage';
import { OwnerPanelPage } from './pages/OwnerPanelPage';
import { SupportChat } from './components/SupportChat';
import { Button } from './components/Button';
import { Session } from '@supabase/supabase-js';
import { PricingPage } from './components/PricingPage';

// Define a minimal structure for the authenticated user before profile is loaded
interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

export const App: React.FC = () => {
  // Auth State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'LANDING' | 'AUTH' | 'APP' | 'DEV_PANEL' | 'OWNER_PANEL' | 'PRICING'>('LANDING');
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false); // Estado para controlar o painel lateral do chat
  
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
      role: profileRole,
    };
  }, [authUser, profile, profileRole]);

  // Generation Logic Hook
  const { 
    form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, downloadImage,
    usage, isLoadingUsage
  } = useGeneration(user);
  
  // Landing Images Hook (Used by LandingPage and DevPanel)
  const { images: landingImages, isLoading: isLandingImagesLoading } = useLandingImages(user);

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
      } else if (view !== 'APP' && user.role !== 'owner' && user.role !== 'admin' && user.role !== 'dev' && view !== 'PRICING') {
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
    return <DevPanelPage user={user} onBackToApp={() => setView('APP')} onLogout={handleLogout} />;
  }
  
  if (view === 'PRICING' && user) {
      return <PricingPage user={user} onBackToApp={() => setView('APP')} />;
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
      >
        {/* Botão de Preços (visível para todos os usuários autenticados) */}
        {user && user.role !== 'owner' && user.role !== 'admin' && user.role !== 'dev' && (
            <Button 
                variant="secondary" 
                onClick={() => setView('PRICING')} 
                className="h-10 px-4 text-sm"
                icon={<DollarSign size={16} />}
            >
                Preços
            </Button>
        )}
      </AppHeader>

      <div className="relative z-10 -mt-8 md:-mt-10">
        <AppTitleHeader />
      </div>

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
                usage={usage}
                isLoadingUsage={isLoadingUsage}
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
      
      {/* Botão Flutuante do Chat */}
      {user && (
        <Button 
            onClick={() => setShowChat(!showChat)}
            className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-100 transition-all duration-300 ${
                showChat ? 'bg-red-600 hover:bg-red-700 shadow-red-500/50' : 'bg-primary hover:bg-primary-dark shadow-primary/50'
            }`}
            icon={showChat ? <X size={24} /> : <MessageSquare size={24} />}
            title={showChat ? "Fechar Chat" : "Abrir Chat de Suporte"}
        >
            <span className="sr-only">{showChat ? "Fechar Chat" : "Abrir Chat"}</span>
        </Button>
      )}
      
      {/* Painel Lateral do Chat */}
      {user && (
        <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-zinc-950/95 backdrop-blur-sm z-[100] transition-transform duration-500 ease-in-out shadow-2xl shadow-black/50 ${
            showChat ? 'translate-x-0' : 'translate-x-full'
        }`}>
            <div className="h-full flex flex-col">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageSquare size={20} className="text-primary" /> Suporte ao Cliente
                    </h3>
                    <Button variant="secondary" onClick={() => setShowChat(false)} icon={<X size={16} />} className="h-8 w-8 p-0">
                        <span className="sr-only">Fechar</span>
                    </Button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <SupportChat user={user} onClose={() => setShowChat(false)} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};