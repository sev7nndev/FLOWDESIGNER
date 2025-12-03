import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, QuotaCheckResponse } from './types';
import { getSupabase } from './services/supabaseClient';
import { AppTitleHeader } from './components/AppTitleHeader';
import { LandingPage } from './components/LandingPage';
import { AuthScreens } from './components/AuthScreens';
import { Sparkles } from 'lucide-react';
import { useGeneration } from './hooks/useGeneration';
import { ResultDisplay } from './components/ResultDisplay';
import { SettingsModal, UpgradeModal } from './components/Modals'; // Import UpgradeModal
import { useProfile } from './hooks/useProfile'; 
import { GenerationForm } from './components/GenerationForm';
import { AppHeader } from './components/AppHeader'; 
import { useLandingImages } from './hooks/useLandingImages'; 
import { DevPanelPage } from './pages/DevPanelPage'; 
import { PlansPage } from './pages/PlansPage'; // Import PlansPage
import { useUsage } from './hooks/useUsage'; // Import useUsage
import { Toaster } from 'sonner'; // Import Toaster
import { CheckoutPage } from './pages/CheckoutPage'; // Import CheckoutPage

// Define a minimal structure for the authenticated user before profile is loaded
interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

export const App: React.FC = () => {
  // Auth State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'LANDING' | 'AUTH' | 'APP' | 'DEV_PANEL' | 'PLANS' | 'CHECKOUT'>('LANDING'); // Added 'CHECKOUT' view
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<QuotaCheckResponse | null>(null); // State for Upgrade Modal
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null); // NEW: Track selected plan before auth
  
  // Profile Hook
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile(authUser?.id);

  // Combined User State (passed to hooks/components)
  const profileRole = (profile?.role || 'free') as UserRole;
  
  // Usage Hook
  const { 
    quota, 
    isLoading: isUsageLoading, 
    refreshUsage, 
    quotaStatus, 
    currentUsage, 
    maxImages,
    currentPlan,
    plans 
  } = useUsage(authUser?.id, profileRole); 

  // Combined User State (passed to hooks/components)
  const user: User | null = authUser && profile ? {
    id: authUser.id,
    email: authUser.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    createdAt: authUser.createdAt,
    role: profileRole, 
  } : null;
  
  // Helper function to open upgrade modal
  const openUpgradeModal = useCallback((quotaResponse: QuotaCheckResponse) => {
      setShowUpgradeModal(quotaResponse);
  }, []);

  // Generation Logic Hook
  const { 
    form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, downloadImage
  } = useGeneration(user, refreshUsage, openUpgradeModal); 
  
  // Landing Images Hook (Used by LandingPage and DevPanel)
  const { images: landingImages, isLoading: isLandingImagesLoading } = useLandingImages(profileRole);

  // NEW: Handle plan selection from Landing Page or Plans Page
  const handleSelectPlan = useCallback((planId: string) => {
      setSelectedPlanId(planId);
      if (planId === 'free') {
          setView('AUTH'); // Free plan -> Auth/Signup
      } else {
          // Paid plan -> Checkout. If user is already logged in, proceed to checkout. If not, they will be prompted to log in/sign up first.
          if (authUser) {
              setView('CHECKOUT');
          } else {
              setView('AUTH'); // If not logged in, go to auth first. Checkout logic will handle redirection after successful auth.
          }
      }
  }, [authUser]);
  
  // NEW: Handle generic start/show plans (Leads to PLANS screen)
  const handleShowPlans = useCallback(() => {
      setView('PLANS');
  }, []);


  const fetchAuthUser = (supabaseUser: any) => {
    const newAuthUser: AuthUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      createdAt: Date.parse(supabaseUser.created_at) || Date.now()
    };
    setAuthUser(newAuthUser);
    
    // If a plan was selected before authentication, redirect to checkout immediately after successful login
    if (selectedPlanId && selectedPlanId !== 'free') {
        setView('CHECKOUT');
    } else {
        setView('APP');
    }
    setSelectedPlanId(null); // Clear selected plan after successful login/redirection
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
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // Show loading state while profile/usage is being fetched after successful authentication
  if (view === 'APP' && !user && authUser && (isProfileLoading || isUsageLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Sparkles size={32} className="animate-spin text-primary" />
      </div>
    );
  }
  
  // --- RENDER VIEWS ---

  if (view === 'LANDING') {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LandingPage 
          onGetStarted={handleShowPlans} // CTA principal agora leva para a página de planos
          onLogin={() => setView('AUTH')} 
          onSelectPlan={handleSelectPlan} // Seleção de plano na seção de preços leva para AUTH/CHECKOUT
          onShowPlans={handleShowPlans} // Botão Criar Conta na navbar leva para a página de planos
          landingImages={landingImages}
          isLandingImagesLoading={isLandingImagesLoading}
        />
      </>
    );
  }

  if (view === 'AUTH') {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AuthScreens 
            onSuccess={() => {}} 
            onBack={() => { setView('LANDING'); setSelectedPlanId(null); }} 
            selectedPlanId={selectedPlanId} // Pass selected plan
            plans={plans} // Pass plans for context
        />
      </>
    );
  }
  
  if (view === 'PLANS') {
    return (
      <>
        <Toaster position="top-right" richColors />
        <PlansPage 
            user={user} 
            onBackToApp={() => setView(user ? 'APP' : 'LANDING')} 
            onSelectPlan={handleSelectPlan} 
            plans={plans} 
            isLoadingPlans={isUsageLoading} 
        />
      </>
    );
  }
  
  if (view === 'CHECKOUT') {
      if (!selectedPlanId || !user) {
          // If no plan selected or user is not logged in, redirect to plans page
          setView('PLANS');
          return null;
      }
      return (
          <>
              <Toaster position="top-right" richColors />
              <CheckoutPage 
                  user={user}
                  planId={selectedPlanId} 
                  onBack={() => setView('PLANS')} 
                  onSuccess={() => setView('APP')} 
                  plans={plans}
              />
          </>
      );
  }
  
  // MAIN APP UI (Protected)
  if (!user) {
      // Should not happen if auth flow is correct, but handles fallback
      return <div className="min-h-screen bg-zinc-950" />;
  }
  
  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-primary/30 overflow-x-hidden relative">
      <Toaster position="top-right" richColors />
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
      
      <AppHeader 
        user={user} 
        profileRole={profileRole} 
        onLogout={handleLogout} 
        onShowSettings={() => setShowSettings(true)} 
        onShowDevPanel={() => setView('DEV_PANEL')}
        onShowPlans={() => setView('PLANS')} 
        quotaStatus={quotaStatus} 
        currentUsage={currentUsage}
        maxImages={maxImages}
      />

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
                quotaStatus={quotaStatus} 
                currentUsage={currentUsage}
                maxImages={maxImages}
                currentPlan={currentPlan}
                openUpgradeModal={() => quota && openUpgradeModal(quota)}
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
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(null)} quotaResponse={showUpgradeModal} refreshUsage={refreshUsage} />}
    </div>
  );
};