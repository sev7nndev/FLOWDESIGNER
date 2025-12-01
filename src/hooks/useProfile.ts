import { useState, useEffect, useCallback } from 'react';
import { getSupabase, Database } from '../services/supabaseClient'; 
import { UserProfile, UserRole } from '../types';

interface ProfileResult {
    profile: UserProfile | null;
    isLoading: boolean;
    fetchProfile: () => Promise<void>;
}

// Define the expected structure of the selected data
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export const useProfile = (userId: string | undefined): ProfileResult => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = getSupabase();

    const fetchProfile = useCallback(async () => {
        if (!userId) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, role, credits, last_login')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found (new user)
                throw new Error(error.message);
            }

            const profileData = data as ProfileRow | null; // Explicitly cast data to resolve TS2339

            if (profileData) { 
                setProfile({
                    id: profileData.id, // FIX: Use profileData (Error 6)
                    firstName: profileData.first_name, // FIX: Use profileData (Error 7)
                    lastName: profileData.last_name, // FIX: Use profileData (Error 8)
                    role: profileData.role as UserRole, // FIX: Use profileData (Error 9)
                    credits: profileData.credits, // FIX: Use profileData (Error 10)
                    lastLogin: new Date(profileData.last_login).getTime(), // FIX: Use profileData (Error 11)
                });
            } else {
                // Handle case where profile doesn't exist yet (e.g., just registered)
                setProfile(null);
            }
        } catch (e) {
            console.error("Error fetching profile:", e);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId, supabase]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, isLoading, fetchProfile };
};