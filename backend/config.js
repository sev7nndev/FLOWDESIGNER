// backend/config.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// CORREÇÃO: Verifica a existência das variáveis de ambiente ANTES de usá-las.
// A ausência delas causa uma falha na inicialização que resulta em um erro 500 genérico.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Lança um erro claro que será visível nos logs do servidor durante a inicialização.
    throw new Error('FATAL: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are not defined in the environment variables. The service cannot start.');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Chave pública para o cliente normal
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave de serviço para o cliente admin

// Cliente Supabase padrão para operações do lado do cliente (se necessário no backend)
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente Supabase com privilégios de serviço (admin) para operações de backend
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
    supabase,
    supabaseService,
};