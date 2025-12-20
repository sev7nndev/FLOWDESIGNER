import React, { useState, useEffect, useCallback, Suspense } from 'react';
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
import { Toaster, toast } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { CheckoutPage } from './src/pages/CheckoutPage';
import { SplashScreen } from './src/components/SplashScreen';
import QADashboard from './src/pages/QADashboard';
import ErrorBoundary from './src/components/ErrorBoundary';
import { OwnerPanelPage } from './src/pages/OwnerPanelPage';

// Lazy Load Dev Panel only (Owner Panel now loads directly for faster access)
const DevPanelPage = React.lazy(() => import('./src/pages/DevPanelPage').then(module => ({ default: module.DevPanelPage })));
const AITextOverlay = React.lazy(() => import('./src/components/AITextOverlay').then(module => ({ default: module.default })));

// Define a minimal structure for authenticated user before profile is loaded
interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}


// ERROR BOUNDARY FOR DEBUGGING (PREVENTS BLANK SCREEN)
class DebugErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Critical UI Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 p-10 flex flex-col gap-4 font-mono z-[9999] relative">
          <h1 className="text-4xl font-bold border-b border-red-500 pb-4">CRITICAL RENDER ERROR</h1>
          <div className="bg-red-900/20 p-6 rounded border border-red-500/50">
            <h2 className="text-xl mb-2 text-white">Error Message:</h2>
            <p className="whitespace-pre-wrap">{this.state.error?.message}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded border border-zinc-800 text-gray-400">
            <h2 className="text-xl mb-2 text-white">Troubleshooting:</h2>
            <ul className="list-disc pl-5">
              <li>Check browser console (F12) for component stack trace.</li>
              <li>This usually happens when a component tries to access undefined data.</li>
              <li>Try clearing LocalStorage/SessionStorage.</li>
            </ul>
            <button
              onClick={() => { window.localStorage.clear(); window.location.reload(); }}
              className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold transition-colors"
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

// RENAMED ORIGINAL App TO AppContent
const AppContent: React.FC = () => {
  // Auth State
  // Determine initial view based on URL
  /* 
   * ROUTING LOGIC (Simple State-Based)
   * Maps URL paths to internal View States
   */
  const getInitialView = (): 'LANDING' | 'AUTH' | 'APP' | 'DEV_PANEL' | 'PLANS' | 'CHECKOUT' | 'SAAS_PANEL' | 'QA_DASHBOARD' | 'AI_EDITOR' => {
    const path = window.location.pathname;
    if (path === '/saas-panel' || path === '/owner-panel') return 'SAAS_PANEL';
    if (path === '/dev-panel') return 'DEV_PANEL';
    if (path === '/ai-editor') return 'AI_EDITOR';
    if (path === '/admin/qa-dashboard') return 'QA_DASHBOARD';
    // If user is already logged in, this will be overridden by auth check, but good for defaults
    return 'LANDING';
  };

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'LANDING' | 'AUTH' | 'APP' | 'DEV_PANEL' | 'PLANS' | 'CHECKOUT' | 'SAAS_PANEL' | 'QA_DASHBOARD' | 'AI_EDITOR'>(getInitialView);
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<QuotaCheckResponse | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Profile Hook
  const { profile, updateProfile } = useProfile(authUser?.id);

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
  // REAL AUTHENTICATION RESTORED
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
    form, state, handleInputChange, handleLogoUpload, handleGenerate, loadExample, loadHistory, downloadImage,
    selectedStyle, setSelectedStyle, handleEnhancePrompt, isEnhancing, deleteHistoryItem, isLoadingHistory
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

  const fetchAuthUser = useCallback((supabaseUser: any) => {
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
  }, [selectedPlanId]);

  // Init Auth & History
  useEffect(() => {
    console.log('🔄 App: Initializing auth...');
    const supabase = getSupabase();
    console.log('🔄 App: Supabase client:', supabase ? 'OK' : 'NULL');

    // Safety Timeout: Force stop loading after 2 seconds if Supabase hangs
    const timeoutId = setTimeout(() => {
      console.warn("⚠️ App: Auth check timed out after 2s. Forcing load completion.");
      setIsAuthLoading(false);
      setView('LANDING');
    }, 2000);

    if (supabase) {
      // Check Session on initial load
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('🔄 App: Session check:', session ? 'User found' : 'No session');
        clearTimeout(timeoutId); // Clear timeout if session check completes
        if (session?.user) {
          fetchAuthUser(session.user);
        } else {
          setView('LANDING');
        }
      }).catch((error) => {
        console.error('❌ App: Session error:', error);
        clearTimeout(timeoutId); // Clear timeout on error
        setView('LANDING');
      }).finally(() => {
        console.log('✅ App: Auth loading complete');
        setIsAuthLoading(false); // Mark auth check as complete
      });

      // Listen for Auth Changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('🔄 App: Auth state changed:', _event);
        if (session?.user) {
          fetchAuthUser(session.user);
        } else {
          setAuthUser(null);
          setView('LANDING');
        }
      });

      return () => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    } else {
      console.error('❌ App: Supabase not configured!');
      clearTimeout(timeoutId);
      setIsAuthLoading(false); // Ensure loading stops if Supabase isn't configured
      // Keep existing view (which might be SAAS_PANEL from initial load)
      if (window.location.pathname !== '/saas-panel') {
        setView('LANDING');
      }
    }

    // Check for payment callbacks
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const plan = params.get('plan');

    if (status === 'success') {
      toast.success(`Pagamento do plano ${plan?.toUpperCase()} confirmado!`, {
        duration: 5000,
        description: 'Sua conta foi atualizada.'
      });
      // Clear URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'failure') {
      toast.error('O pagamento falhou ou foi cancelado.', {
        duration: 5000
      });
    }
  }, []);

  // 🛡️ EMERGENCY FAILSAFE: Force-quit loading state after 4s no matter what
  useEffect(() => {
    const emergencyTimer = setTimeout(() => {
      setIsAuthLoading((current) => {
        if (current) {
          console.error("🚨 EMERGENCY FAILSAFE TRIGGERED: Force-stopping loading state");
          return false;
        }
        return current;
      });
    }, 4000);
    return () => clearTimeout(emergencyTimer);
  }, []);

  // Load history when user logs in
  // TEMPORARILY DISABLED: Auto-load causing issues
  /*
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, loadHistory]);
  */

  const handleLogout = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setAuthUser(null);
    setView('LANDING');
  }, []);

  // --- RENDER VIEWS ---

  // Show SplashScreen during the very initial auth check
  if (isAuthLoading) {
    return <SplashScreen />;
  }

  if (view === 'LANDING') {
    return (
      <div className="app-container">
        <Toaster position="top-right" richColors />
        <Analytics />
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
          onSuccess={() => { }}
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

  if (view === 'DEV_PANEL') {
    return (
      <div className="app-container">
        <Toaster position="top-right" richColors />
        <Suspense fallback={<SplashScreen />}>
          <DevPanelPage
            user={user}
            onBackToApp={() => setView('APP')}
            onLogout={handleLogout}
          />
        </Suspense>
      </div>
    );
  }

  if (view === 'SAAS_PANEL') {
    return (
      <div className="app-container">
        <Toaster position="top-right" richColors />
        <OwnerPanelPage onBack={() => setView('APP')} />
      </div>
    );
  }

  if (view === 'QA_DASHBOARD') {
    return (
      <div className="app-container">
        <Toaster position="top-right" richColors />
        <QADashboard />
      </div>
    );
  }

  // AI SMART EDITOR ROUTE
  if (view === 'AI_EDITOR') {
    return (
      <div className="app-container">
        <Toaster position="top-right" richColors />
        <button
          onClick={() => setView('APP')}
          className="fixed top-4 left-4 z-50 bg-white/10 backdrop-blur text-white px-4 py-2 rounded hover:bg-white/20 transition-all font-bold"
        >
          ← Voltar
        </button>
        <AITextOverlay />
      </div>
    );
  }

  // MAIN APP UI (Protected) - Redirect to landing if not logged in
  // MAIN APP UI (Protected) - Redirect to landing if not logged in
  if (!user) {
    // CASE 1: User is authenticated but Profile is still loading -> Show Splash, Don't Redirect
    if (authUser) {
      return <SplashScreen />;
    }

    // CASE 2: User is NOT authenticated -> Redirect to Landing
    setView('LANDING');
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
        onShowSaaSPanel={() => setView('SAAS_PANEL')}
        quotaStatus={quotaStatus}
        currentUsage={currentUsage}
        maxImages={maxImages}
      />

      <div className="relative z-10 -mt-8 md:-mt-10">
        <AppTitleHeader />
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-6 pb-24 relative z-20 mt-[-2rem] md:mt-[-4rem] p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-7">
            <GenerationForm
              form={form}
              status={state.status}
              error={state.error}
              handleInputChange={handleInputChange}
              handleGenerate={handleGenerate}
              loadExample={loadExample}
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              quotaStatus={quotaStatus}
              currentUsage={currentUsage}
              maxImages={maxImages}
              currentPlan={currentPlan}
              openUpgradeModal={() => quota && openUpgradeModal(quota)}
              handleEnhancePrompt={handleEnhancePrompt}
              isEnhancing={isEnhancing}
            />
          </div>

          <div className="lg:col-span-5">
            <ResultDisplay
              state={state}
              downloadImage={downloadImage}
              showGallery={showGallery}
              setShowGallery={setShowGallery}
              onDelete={deleteHistoryItem}
              isLoadingHistory={isLoadingHistory}
              loadHistory={loadHistory}
            />
          </div>
        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} updateProfile={updateProfile} profileRole={user.role} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(null)} quotaResponse={showUpgradeModal} />}
    </div>
  );
};