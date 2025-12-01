const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Environment Variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY || !GEMINI_API_KEY) {
  console.error("Missing one or more environment variables. Please check your .env.local file.");
  // Não saímos do processo aqui, apenas logamos o erro, pois o servidor Express precisa iniciar para o frontend funcionar.
  // As rotas que dependem dessas chaves falharão internamente.
}

// Supabase Clients
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Gemini AI Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

module.exports = {
  supabaseService,
  supabaseAnon,
  imageModel,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
};