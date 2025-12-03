require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Google Gemini Configuration
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const imageModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Plan limits
const PRO_LIMIT = 50;
const STARTER_LIMIT = 20;
const FREE_LIMIT = 3;

// Mercado Pago Configuration
const mercadopago = require('mercadopago');
const mpAccessToken = process.env.MP_ACCESS_TOKEN;

if (!mpAccessToken) {
  console.warn('⚠️ MP_ACCESS_TOKEN não configurado. Pagamentos não funcionarão.');
} else {
  console.log('✅ Mercado Pago configurado com access token');
}

mercadopago.configure({
  access_token: mpAccessToken || '',
});

module.exports = {
  supabaseAnon,
  supabaseService,
  imageModel,
  PRO_LIMIT,
  STARTER_LIMIT,
  FREE_LIMIT,
  mercadopago,
};