// backend/config.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase;
let supabaseService;

try {
    // 1. Validação rigorosa da existência das variáveis
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
        throw new Error('One or more required Supabase environment variables (SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY) are missing.');
    }

    // 2. Tentativa de criação dos clientes (o ponto de falha anterior)
    // Cliente Supabase padrão
    supabase = createClient(supabaseUrl, supabaseKey);

    // Cliente Supabase com privilégios de serviço (admin)
    supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Verificação final para garantir que os objetos foram criados
    if (!supabase || !supabaseService) {
        throw new Error('Supabase client objects could not be created. Check the validity of your environment variables.');
    }

} catch (error) {
    // 4. Captura qualquer erro durante o processo e o torna explícito
    console.error('---------------------------------------------------------');
    console.error('--- FATAL ERROR DURING SUPABASE CLIENT INITIALIZATION ---');
    console.error('---------------------------------------------------------');
    console.error('This is likely due to invalid or malformed environment variables in your .env file or hosting configuration.');
    console.error(`Original Error: ${error.message}`);
    console.error('---------------------------------------------------------');
    
    // Impede que o resto da aplicação execute com uma configuração quebrada.
    // Isso garante que o erro seja visível nos logs do servidor na inicialização.
    throw new Error(`Supabase initialization failed: ${error.message}`);
}

module.exports = {
    supabase,
    supabaseService,
};