import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabase } from '../services/supabaseClient'; // Usando getSupabase
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = getSupabase(); // Obtendo o cliente Supabase

  useEffect(() => {
    if (!supabase) {
        setIsLoading(false);
        return;
    }
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => { // Tipagem corrigida
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (session?.user) {
          // Fetch user role from the 'profiles' table
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Error fetching user role:', error);
            setUserRole('free'); // Default to lowest role on error
          } else if (data) {
            setUserRole(data.role);
          } else {
            setUserRole('free');
          }
        } else {
          setUserRole(null);
        }
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => { // Tipagem corrigida
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user: user ? { ...user, role: userRole || 'free' } : null, session, isLoading, userRole, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};