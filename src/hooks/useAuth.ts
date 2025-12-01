import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../services/supabaseClient'; // FIX: Removed unused Database import
import { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { useProfile } from './useProfile';
import { AuthChangeEvent, Session } from '@supabase/supabase-js'; 

interface AuthResult {
    user: User | null;
    profile: { firstName: string; lastName: string; role: UserRole } | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuth = (): AuthResult => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = getSupabase();

    // 1. Fetch Profile using the current user ID
    const { profile, isLoading: isLoadingProfile, fetchProfile: _fetchProfile } = useProfile(user?.id); 

    // 2. Session Management
    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => { 
            if (session?.user) {
                const supabaseUser = session.user;
                
                // Map Supabase user to local User type
                const newUser: User = {
                    id: supabaseUser.id,
                    email: supabaseUser.email || '',
                    firstName: supabaseUser.user_metadata.first_name || '',
                    lastName: supabaseUser.user_metadata.last_name || '',
                    createdAt: new Date(supabaseUser.created_at).getTime(),
                    role: profile?.role || 'free', // Role is updated via useProfile
                };
                setUser(newUser);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        // Fetch initial session status
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => { 
            if (session?.user) {
                const supabaseUser = session.user;
                setUser({
                    id: supabaseUser.id,
                    email: supabaseUser.email || '',
                    firstName: supabaseUser.user_metadata.first_name || '',
                    lastName: supabaseUser.user_metadata.last_name || '',
                    createdAt: new Date(supabaseUser.created_at).getTime(),
                    role: profile?.role || 'free',
                });
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase, profile?.role]); 
    
    // 3. Update User object when profile changes (especially role)
    useEffect(() => {
        if (user && profile) {
            setUser((prev: User | null) => prev ? { ...prev, role: profile.role, firstName: profile.firstName, lastName: profile.lastName } : null); 
        }
    }, [profile, user]);


    // 4. Auth Actions
    const login = useCallback(async (email: string, password: string) => {
        await authService.login(email, password);
        // After successful login, onAuthStateChange will trigger and update user/profile
    }, []);

    const register = useCallback(async (firstName: string, lastName: string, email: string, password: string) => {
        await authService.register(firstName, lastName, email, password);
        // After successful registration, the user needs to confirm email, so no immediate session update expected.
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
    }, []);

    return {
        user,
        profile,
        isLoading: isLoading || isLoadingProfile,
        login,
        register,
        logout,
    };
};