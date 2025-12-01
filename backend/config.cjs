// backend/config.cjs
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' }); // Load environment variables from the root .env.local

// --- Supabase Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Used for server-side operations

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
    console.error("FATAL ERROR: Supabase environment variables are not set.");
    process.exit(1);
}

// Client for public/client-side operations (e.g., checking job status without auth)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Client for server-side operations (e.g., updating database, storage uploads)
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        persistSession: false, // Important for server-side
    }
});

// --- Gemini Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set.");
    process.exit(1);
}

// --- Quota Configuration ---
const FREE_LIMIT = 5;
const STARTER_LIMIT = 20;
const PRO_LIMIT = 50; // Novo limite para o plano Pro

module.exports = {
    supabaseAnon,
    supabaseService,
    GEMINI_API_KEY,
    FREE_LIMIT,
    STARTER_LIMIT,
    PRO_LIMIT,
};