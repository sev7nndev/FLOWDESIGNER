import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define the Supabase database schema types (minimal for now)
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    role: string;
                    credits: number;
                    last_login: string;
                };
                Insert: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    role?: string;
                    credits?: number;
                };
                Update: {
                    first_name?: string;
                    last_name?: string;
                    role?: string;
                    credits?: number;
                };
            };
            // Add other tables like 'generations' later
        };
        Views: {};
        Functions: {};
        Enums: {};
        CompositeTypes: {};
    };
}

let supabaseClient: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> => {
    if (!supabaseClient) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Supabase environment variables are not set.");
        }

        supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient;
};