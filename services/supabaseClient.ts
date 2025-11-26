import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use variáveis de ambiente injetadas pelo Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase environment variables are not configured.");
    return null;
  }

  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseInstance;
  } catch (e) {
    console.error("Failed to init Supabase", e);
    return null;
  }
};

export const isSupabaseConfigured = () => !!getSupabase();