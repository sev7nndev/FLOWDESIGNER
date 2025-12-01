import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '../services/supabaseClient';

interface ProfileData {
    firstName: string;
    lastName: string;
    role: string;
}

export const useProfile = (userId: string | undefined) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabase();

    const fetchProfile = useCallback(async () => {
        if (!userId || !supabase) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // RLS is enabled on the 'profiles' table, ensuring the user only sees their own data.
            const { data, error } = await supabase
                .from('profiles')
                .select('first_name, last_name, role, updated_at')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found'
                throw new Error(error.message);
            }

            if (data) {
                setProfile({
                    firstName: data.first_name || '',
                    lastName: data.last_name || '',
                    role: data.role || 'free',
                });
            } else {
                // Handle case where profile might not exist immediately after signup
                setProfile({ firstName: '', lastName: '', role: 'free' });
            }
        } catch (e: any) {
            console.error("Failed to fetch profile:", e);
            setError(e.message || 'Falha ao carregar perfil.');
        } finally {
            setIsLoading(false);
        }
    }, [userId, supabase]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = useCallback(async (newFirstName: string, newLastName: string) => {
        if (!userId || !supabase) return;

        setIsLoading(true);
        setError(null);

        try {
            // A RLS (Row Level Security) garante que apenas o usuário autenticado possa atualizar seu próprio perfil.
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    first_name: newFirstName, 
                    last_name: newLastName,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                throw new Error(error.message);
            }

            // Atualiza o estado local após o sucesso
            setProfile((prev: ProfileData | null) => ({
                ...prev!,
                firstName: newFirstName,
                lastName: newLastName,
                role: prev?.role || 'free' // Mantém o role
            }));
            
            return true;
        } catch (e: any) {
            console.error("Failed to update profile:", e);
            setError(e.message || 'Falha ao atualizar perfil.');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [userId, supabase]);

    return { profile, isLoading, error, fetchProfile, updateProfile };
};