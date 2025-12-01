import { createClient } from '@supabase/supabase-js';

    // As variáveis devem ser lidas do ambiente de build (Vite/React)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    let supabase = null;

    export const getSupabase = () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        // Esta é a condição que provavelmente está sendo atingida
        console.error("Supabase environment variables are missing. Check your .env file and VITE_ prefix.");
        return null; 
      }
      
      if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
      }
      return supabase;
    };