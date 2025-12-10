import useSWR from 'swr';
import { getSupabase } from '../services/supabaseClient';

interface ProfileData {
    firstName: string;
    lastName: string;
    role: string;
}

export const useProfile = (userId: string | undefined) => {
    const supabase = getSupabase();

    const fetcher = async (uid: string): Promise<ProfileData> => {
        if (!supabase) throw new Error("No supabase client");

        // 1. Try fetching via Supabase Client (subject to RLS)
        let profileData: any = null;

        const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, role, updated_at')
            .eq('id', uid)
            .single();

        if (data) {
            profileData = data;
        } else if (error && error.code !== 'PGRST116') {
            console.warn("Supabase client fetch error:", error);
        }

        // 2. If client fetch failed or returned nothing, try API Proxy (Bypasses RLS)
        if (!profileData) {
            console.log("⚠️ Client fetch failed/empty, attempting API Proxy backup...");
            try {
                const res = await fetch(`/api/profile/${uid}`);
                if (res.ok) {
                    const apiData = await res.json();
                    profileData = {
                        first_name: apiData.first_name,
                        last_name: apiData.last_name,
                        role: apiData.role
                    };
                }
            } catch (apiErr) {
                console.error("API Proxy connection failed:", apiErr);
            }
        }

        if (profileData) {
            return {
                firstName: profileData.first_name || '',
                lastName: profileData.last_name || '',
                role: profileData.role || 'free',
            };
        }

        // Default fallback
        return { firstName: '', lastName: '', role: 'free' };
    };

    const { data: profile, error, isLoading, mutate } = useSWR(
        userId ? ['profile', userId] : null,
        ([, uid]) => fetcher(uid),
        {
            revalidateOnFocus: false, // Profile changes rarely
            dedupingInterval: 10000
        }
    );

    // Update function (Mutation)
    const updateProfile = async (newFirstName: string, newLastName: string) => {
        if (!userId || !supabase) return false;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: newFirstName,
                    last_name: newLastName,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update via mutation
            mutate((prev: ProfileData | undefined) => prev ? { ...prev, firstName: newFirstName, lastName: newLastName } : undefined, false);
            return true;
        } catch (e: any) {
            console.error("Failed to update profile:", e);
            return false;
        }
    };

    return {
        profile: profile || null,
        isLoading: isLoading && !!userId,
        error: error ? 'Falha ao carregar perfil.' : null,
        fetchProfile: mutate, // Compatible
        updateProfile
    };
};