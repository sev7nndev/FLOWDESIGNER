import React, { useState, useEffect } from 'react';
import { supabase } from './integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import IndexPage from './pages/Index';
import { AuthScreens } from './components/AuthScreens';
import { Toaster } from 'sonner';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {user ? <IndexPage /> : <AuthScreens onSuccess={(loggedInUser) => setUser(loggedInUser)} onBack={() => {}} />}
      <Toaster richColors theme="dark" position="top-right" />
    </>
  );
}

export default App;