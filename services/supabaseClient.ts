import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const storedGlobal = localStorage.getItem('flow_global_settings');
  if (storedGlobal) {
    const settings: AppSettings = JSON.parse(storedGlobal);
    if (settings.supabaseUrl && settings.supabaseKey) {
      try {
        // Note: settings.perplexityKey and settings.freepikKey are no longer used here
        supabaseInstance = createClient(settings.supabaseUrl, settings.supabaseKey);
        return supabaseInstance;
      } catch (e) {
        console.error("Failed to init Supabase", e);
        return null;
      }
    }
  }
  return null;
};

export const isSupabaseConfigured = () => !!getSupabase();