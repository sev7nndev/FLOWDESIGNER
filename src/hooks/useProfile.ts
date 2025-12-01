import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../services/supabaseClient';
import { UserProfile, UserRole } from '../types';

interface ProfileResult {
    profile: UserProfile | null;
    isLoading: boolean;
    fetchProfile: () => Promise<void>;
}

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

            if (data) {
                setProfile({
                    id: data.id,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    role: data.role as UserRole,
                    credits: data.credits,
                    lastLogin: new Date(data.last_login).getTime(),
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