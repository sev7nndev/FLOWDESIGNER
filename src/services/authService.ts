import { getSupabase, Database } from './supabaseClient'; 
import { UserRole } from '../types'; // Import UserRole

export const authService = {
    async login(email: string, password: string): Promise<void> {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            throw new Error(error.message);
        }
    },

    async register(firstName: string, lastName: string, email: string, password: string): Promise<void> {
        const supabase = getSupabase();
        
        // 1. Register the user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                },
            },
        });

        if (error) {
            throw new Error(error.message);
        }
        
        // 2. Create the profile entry (Supabase RLS should handle this, but we ensure metadata is set)
        if (data.user) {
            // Define Insert type for profiles table
            type ProfileInsert = Database['public']['Tables']['profiles']['Insert']; 
            
            const profileData: ProfileInsert = {
                id: data.user.id,
                first_name: firstName,
                last_name: lastName,
                role: 'free' as UserRole, // Default role, cast to UserRole
                credits: 10, // Initial credits
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .insert([profileData]); // FIX: Use the typed object in an array (Error 1)

            if (profileError) {
                // Log profile creation error but don't block registration success
                console.error("Error creating user profile:", profileError.message);
            }
        }
    },

    async logout(): Promise<void> {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw new Error(error.message);
        }
    },
};