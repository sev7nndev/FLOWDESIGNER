// backend/config.cjs
const { createClient } = require('@supabase/supabase-js');
// CORREÇÃO CRÍTICA: Garantir que o .env.local seja carregado corretamente
require('dotenv').config({ path: '../.env.local' }); 
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Stripe = require('stripe');

// --- Supabase Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Stripe Configuration ---
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_START_PLAN_PRICE_ID = process.env.STRIPE_START_PLAN_PRICE_ID;
const STRIPE_PRO_PLAN_PRICE_ID = process.env.STRIPE_PRO_PLAN_PRICE_ID;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY || !STRIPE_SECRET_KEY) {
    console.error("FATAL ERROR: Missing one or more environment variables. Check your .env.local file.");
}

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

// --- Gemini Configuration ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

// --- Stripe Client ---
const stripe = new Stripe(STRIPE_SECRET_KEY);

// --- Quota Configuration ---
const FREE_LIMIT = 5;
const STARTER_LIMIT = 20;
const PRO_LIMIT = 50; 

module.exports = {
    supabaseAnon,
    supabaseService,
    imageModel,
    stripe, // Exportando o cliente Stripe
    STRIPE_WEBHOOK_SECRET,
    STRIPE_START_PLAN_PRICE_ID,
    STRIPE_PRO_PLAN_PRICE_ID,
    GEMINI_API_KEY,
    FREE_LIMIT,
    STARTER_LIMIT,
    PRO_LIMIT,
};