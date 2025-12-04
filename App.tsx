import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, QuotaCheckResponse } from './types';
import { getSupabase } from './services/supabaseClient';
import { AppTitleHeader } from './src/components/AppTitleHeader';
import { LandingPage } from './src/components/LandingPage';
import { AuthScreens } from './src/components/AuthScreens';
import { useGeneration } from './hooks/useGeneration';
import { ResultDisplay } from './src/components/ResultDisplay';
import { SettingsModal, UpgradeModal } from './src/components/Modals'; 
import { useProfile } from './hooks/useProfile'; 
import { GenerationForm } from './src/components/GenerationForm';
import { AppHeader } from './src/components/AppHeader'; 
import { useLandingImages } from './hooks/useLandingImages'; 
import { PlansPage } from './src/pages/PlansPage'; 
import { useUsage } from './hooks/useUsage'; 
import { Toaster } from 'sonner'; 
import { CheckoutPage } from './src/pages/CheckoutPage'; 
import { SplashScreen } from './src/components/SplashScreen'; // Import SplashScreen

// Define a minimal structure for authenticated user before profile is loaded
interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

export const App: React.FC = () => {
  // Auth State
  const [isAuthLoading, setIsAuthLoading] = useState(true); // NEW: State for initial auth check
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'LANDING' | 'AUTH' | 'APP' | 'DEV_PANEL' | 'PLANS' | 'CHECKOUT'>('LANDING');
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<QuotaCheckResponse | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  // Profile Hook
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile(authUser?.id);

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
  } = useUsage(authUser?.id, (profile?.role || 'free') as UserRole); 

  // Combined User State (passed to hooks/components)
  const user: User | null = authUser && profile ? {
    id: authUser.id,
    email: authUser.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    createdAt: authUser.createdAt,
    role: (profile.role || 'free') as UserRole, 
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
  const { images: landingImages, isLoading: isLandingImagesLoading } = useLandingImages((user?.role || 'free') as UserRole);

  // Handle plan selection from Landing Page or Plans Page
  const handleSelectPlan = useCallback((planId: string) => {
      setSelectedPlanId(planId);
      if (planId === 'free') {
          setView('AUTH');
      } else {
          if (authUser) {
              setView('CHECKOUT');
          } else {
              setView('AUTH');
          }
      }
  }, [authUser]);
  
  // Handle generic start/show plans (Leads to PLANS screen)
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
    
    if (selectedPlanId && selectedPlanId !== 'free') {
        setView('CHECKOUT');
    } else {
        setView('APP');
    }
    setSelectedPlanId(null);
  };

  // Init Auth & History
  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      // Check Session on initial load
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchAuthUser(session.user);
        } else {
          setView('LANDING');
        }
      }).finally(() => {
        setIsAuthLoading(false); // Mark auth check as complete
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
    } else {
      setIsAuthLoading(false); // Ensure loading stops if Supabase isn't configured
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

  // --- RENDER VIEWS ---

  // Show SplashScreen during the very initial auth check
  if (isAuthLoading) {
    return <SplashScreen />;
  }

  if (view === 'LANDING') {
    return (
      <div className="app-container">
        <Toaster position="top-right" richColors />
        <LandingPage 
          onGetStarted={handleShowPlans}
          onLogin={() => setView('AUTH')} 
          onSelectPlan={handleSelectPlan}
          onShowPlans={handleShowPlans}
          landingImages={landingImages}
          isLandingImagesLoading={isLandingImagesLoading}
        />
      </div>
    );
  }

  if (view === 'AUTH') {
    return (
      <div className="app-container">
        <Toaster position="top-right" richColors />
        <AuthScreens 
            onSuccess={() => {}} 
            onBack={() => { setView('LANDING'); setSelectedPlanId(null); }} 
            selectedPlanId={selectedPlanId}
            plans={plans}
        />
      </div>
    );
  }
  
  if (view === 'PLANS') {
    return (
      <div className="app-container">
        <Toaster position="top-right" richColors />
        <PlansPage 
            user={user} 
            onBackToApp={() => setView(user ? 'APP' : 'LANDING')} 
            onSelectPlan={handleSelectPlan} 
            plans={plans} 
            isLoadingPlans={isUsageLoading} 
        />
      </div>
    );
  }
  
  if (view === 'CHECKOUT') {
      if (!selectedPlanId || !user) {
          setView('PLANS');
          return null;
      }
      return (
          <div className="app-container">
              <Toaster position="top-right" richColors />
              <CheckoutPage 
                  user={user}
                  planId={selectedPlanId} 
                  onBack={() => setView('PLANS')} 
                  plans={plans}
              />
          </div>
      );
  }
  
  // MAIN APP UI (Protected)
  if (!user) {
      // This case handles the brief moment after logout or if auth fails silently
      return <SplashScreen />;
  }
  
  return (
    <div className="app-container min-h-screen text-gray-100 font-sans selection:bg-primary/30 overflow-x-hidden relative">
      <Toaster position="top-right" richColors />
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
      
      <AppHeader 
        user={user} 
        profileRole={user.role} 
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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} updateProfile={updateProfile} profileRole={user.role} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(null)} quotaResponse={showUpgradeModal} />}
    </div>
  );
};