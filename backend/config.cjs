const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const mercadopago = require('mercadopago');

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

let supabaseAnon = null;
let supabaseServiceRole = null;

const isSupabaseConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_KEY;

if (!isSupabaseConfigured) {
    console.warn("WARNING: Supabase environment variables (URL, ANON_KEY, SERVICE_KEY) are missing.");
} else {
    try {
        supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseServiceRole = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        console.log("Supabase clients initialized.");
    } catch (e) {
        console.error("FATAL ERROR: Failed to initialize Supabase clients:", e);
        process.exit(1);
    }
}

if (MP_ACCESS_TOKEN) {
    mercadopago.configure({ access_token: MP_ACCESS_TOKEN });
    console.log("Mercado Pago configured successfully.");
} else {
    console.warn("WARNING: MERCADO_PAGO_ACCESS_TOKEN not found. Payment routes will be mocked or fail.");
}

if (!GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY not found. AI generation routes will fail.");
}

module.exports = {
    supabaseAnon,
    supabaseServiceRole,
    mercadopago,
    GEMINI_API_KEY,
    PORT: process.env.PORT || 3001,
    FRONTEND_URL: process.env.FRONTEND_URL,
    MP_CLIENT_ID: process.env.MERCADO_PAGO_CLIENT_ID,
};