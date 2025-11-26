import React, { useState, useEffect, useRef } from 'react';
import { User } from './types';
import { getSupabase } from './services/supabaseClient';
import { LampHeader } from './components/Lamp';
import { LandingPage } from './components/LandingPage';
import { AuthScreens } from './components/AuthScreens';
import { LogOut, Settings, Sparkles } from 'lucide-react';
import { useGeneration } from './hooks/useGeneration';
import { ResultDisplay } from './components/ResultDisplay';
import { SettingsModal } from './components/Modals';
import { useProfile } from './hooks/useProfile'; // Import useProfile
import { GenerationForm } from './components/GenerationForm';

// Define a minimal structure for the authenticated user before profile is loaded
interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

export const App: React.FC = () => {
  // Auth State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'LANDING' | 'AUTH' | 'APP'>('LANDING');
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Profile Hook
  const { profile, isLoading: isProfileLoading, fetchProfile, updateProfile } = useProfile(authUser?.id);

  // Combined User State (passed to hooks/components)
  const user: User | null = authUser && profile ? {
    id: authUser.id,
    email: authUser.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    createdAt: authUser.createdAt,
    // Note: Role is kept server-side for security, but we can pass it if needed for UI display
  } : null;

  // Generation Logic Hook
  const { 
    form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, downloadImage, setForm, setState
  } = useGeneration(user);

  const fetchAuthUser = (supabaseUser: any) => {
    const newAuthUser: AuthUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      createdAt: Date.parse(supabaseUser.created_at) || Date.now()
    };
    setAuthUser(newAuthUser);
    setView('APP');
  };

  // Init Auth & History
  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      // Check Session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchAuthUser(session.user);
        } else {
          setView('LANDING');
        }
      });

      // Listen for Auth Changes
      const { data: { subscription } = { data: { subscription: { unsubscribe: () => {} } } } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    }
  }, [user, loadHistory]);


  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setAuthUser(null);
    setView('LANDING');
  };

  // Show loading state while profile is being fetched after successful authentication
  if (view === 'APP' && !user && authUser && isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Sparkles size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // --- RENDER VIEWS ---

  if (view === 'LANDING') {
    return <LandingPage onGetStarted={() => setView('AUTH')} onLogin={() => setView('AUTH')} />;
  }

  if (view === 'AUTH') {
    return <AuthScreens onSuccess={() => {}} onBack={() => setView('LANDING')} />;
  }
  
  // MAIN APP UI (Protected)
  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-primary/30 overflow-x-hidden relative">
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
      
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
              <Sparkles size={16} className="text-primary" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white/90">Flow<span className="text-primary">Designer</span></span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              Olá, {user?.firstName || user?.email}!
            </span>
            <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-white transition-colors" title="Configurações Pessoais">
              <Settings size={18} />
            </button>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <button onClick={handleLogout} className="text-xs font-medium text-gray-400 hover:text-red-400 flex items-center gap-2">
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-8 md:-mt-10">
        <LampHeader />
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-24 relative z-20 mt-[-4rem] md:mt-[-6rem] p-4 border border-white/10 rounded-xl shadow-lg bg-zinc-950/50">
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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} updateProfile={updateProfile} profileRole={profile?.role || 'free'} />}
    </div>
  );
};