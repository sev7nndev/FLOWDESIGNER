import { getSupabase, Database } from './supabaseClient'; 
import { UserRole } from '../types';

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
        
        if (data.user) {
            type ProfileInsert = Database['public']['Tables']['profiles']['Insert']; 
            
            const profileData: ProfileInsert = {
                id: data.user.id,
                first_name: firstName,
                last_name: lastName,
                role: 'free' as UserRole,
                credits: 10,
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .insert([profileData] as any); 

            if (profileError) {
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