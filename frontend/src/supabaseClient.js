// frontend/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente devem ser definidas no arquivo .env.local do frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);