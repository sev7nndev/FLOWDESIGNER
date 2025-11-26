import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Hardcoded public keys for client-side access (Anon Key)
const SUPABASE_URL = "https://akynbiixxcftxgvjpjxu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreW5iaWl4eGNmdHhndmpwanh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjQ3MTcsImV4cCI6MjA3OTc0MDcxN30.FoIp7_p8gI_-JTuL4UU75mfyw1kjUxj0fDvtx6ZwVAI";

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseInstance;
  } catch (e) {
    console.error("Failed to init Supabase", e);
    return null;
  }
};

export const isSupabaseConfigured = () => !!getSupabase();