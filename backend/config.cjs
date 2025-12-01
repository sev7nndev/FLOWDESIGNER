// backend/config.cjs
const { createClient } = require('@supabase/supabase-js');
const path = require('path'); // Importando path
// CORREÇÃO CRÍTICA: Garantir que o .env.local seja carregado corretamente usando path.resolve
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Supabase Configuration ---
// Usando process.env diretamente, pois o dotenv já carregou as variáveis
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usando a chave correta
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
    console.error("FATAL ERROR: Missing one or more environment variables. Check your .env.local file.");
    // Lançar um erro aqui é crucial para evitar que o servidor inicie com credenciais incompletas.
    throw new Error('One or more required environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY) are missing.');
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
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });


// --- Quota Configuration ---
const FREE_LIMIT = 5;
const STARTER_LIMIT = 20;
const PRO_LIMIT = 50; 

module.exports = {
    supabaseAnon,
    supabaseService,
    imageModel, // Exportando o modelo inicializado
    GEMINI_API_KEY,
    FREE_LIMIT,
    STARTER_LIMIT,
    PRO_LIMIT,
};