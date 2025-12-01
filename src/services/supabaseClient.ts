import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '../types'; // Import UserRole

// --- Supabase Database Types (Schema Definition) ---
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          first_name: string
          last_name: string
          role: UserRole // FIX: Using imported UserRole
          credits: number
          last_login: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          role?: UserRole // FIX: Using imported UserRole
          credits?: number
          last_login?: string
        }
        Update: {
          first_name?: string
          last_name?: string
          role?: UserRole // FIX: Using imported UserRole
          credits?: number
          last_login?: string
        }
      }
      // Add other tables like 'generations' and 'usage' here later
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// --- Client Initialization ---
let supabase: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> => {
    if (!supabase) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
        }

        supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return supabase;
};