const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') }); // Load local env too

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'http://localhost:3007/api'; // Test Server Port

// Create Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
// Note: For login we might need anon key if RLS allows, but Service Key bypasses RLS.
// However, signInWithPassword works with Service Key too (as admin usually) or we need anon.
// Let's use env.VITE_SUPABASE_ANON_KEY for auth client just to be safe like frontend.
const supabaseAuth = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY);

async function runTests() {
    console.log('🚀 INICIANDO BATERIA DE TESTES (TARGET: localhost:3006)...');
    let report = {
        registration: false,
        credits_initial: false,
        address_injection: false,
        language_check: false
    };

    // 1. TESTE DE CADASTRO
    console.log('\n--- 1. TESTE DE CADASTRO (FREE) ---');
    const testEmail = `audit_test_${Date.now()}@test.com`;
    const testPassword = 'Password123!';
    let userId = null;

    try {
        console.log(`📡 Registrando usuário: ${testEmail}`);
        // Endpoint points to /api/register
        const regRes = await axios.post(`${API_URL}/register`, {
            email: testEmail,
            password: testPassword,
            firstName: 'Audit',
            lastName: 'Bot'
        });

        if (regRes.status === 200 || regRes.status === 201) {
            console.log('✅ Cadastro via API: SUCESSO');
            userId = regRes.data.user?.id || regRes.data.session?.user?.id;

            // Verificar DB
            const { data: usage } = await supabase.from('user_usage').select('*').eq('user_id', userId).single();
            if (usage) {
                console.log(`📊 DB Usage: Images=${usage.images_generated}, Plan=${usage.plan_id}`);
                if (usage.images_generated === 0 && usage.plan_id === 'free') {
                    console.log('✅ Validação DB (Credits=0, Plan=Free): SUCESSO (Trigger V2 funcionou)');
                    report.registration = true;
                    report.credits_initial = true;
                } else {
                    console.error('❌ DB: Valores incorretos (Esperado 0/free).');
                }
            } else {
                console.error('❌ Falha DB User Usage: Não encontrado.');
            }
        }
    } catch (e) {
        console.error('❌ Erro no Cadastro API:', e.response?.data || e.message);

        // Fallback: Try creating user directly via Admin to continue tests
        console.log('⚠️ Tentando criar usuário via Admin (Fallback)...');
        try {
            const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
                email: testEmail,
                password: testPassword,
                email_confirm: true,
                user_metadata: { first_name: 'Audit', last_name: 'Fallback' }
            });

            if (adminError) throw adminError;
            console.log('✅ Usuário criado via Admin Fallback!');
            userId = adminUser.user.id;

            // Check usage again
            const { data: usage } = await supabase.from('user_usage').select('*').eq('user_id', userId).single();
            if (usage) {
                console.log(`📊 DB Usage (Fallback): Images=${usage.images_generated}`);
            } else {
                // Create usage manually if trigger failed
                console.warn('⚠️ Trigger falhou? Criando usage manualmente...');
                await supabase.from('user_usage').insert({ user_id: userId, images_generated: 0, plan_id: 'free' });
                await supabase.from('profiles').insert({ id: userId, email: testEmail, first_name: 'Audit', role: 'free' });
            }
        } catch (adminE) {
            console.error('❌ Falha Total na criação de usuário:', adminE.message);
        }
    }

    if (!userId) {
        console.error('⛔ Impossível continuar sem User ID.');
        process.exit(1);
    }

    // 2. LOGIN (Obter Token)
    console.log('\n--- 2. AUTENTICAÇÃO (VIA SUPABASE SDK) ---');
    let token = null;
    try {
        const { data, error } = await supabaseAuth.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (error) throw error;
        token = data.session.access_token;
        console.log('✅ Login Supabase: SUCESSO. Token obtido.');
    } catch (e) {
        console.error('❌ Erro Login:', e.message);
    }

    if (!token) process.exit(1);

    // 3. TESTE DE GERAÇÃO (LÓGICA E PROMPT)
    console.log('\n--- 3. TESTE DE GERAÇÃO DE ARTE (SIMULAÇÃO) ---');
    // Define businessInfo here so it is available
    const businessInfo = {
        companyName: 'Audit Pizza',
        addressStreet: 'Rua das Flores',
        addressNumber: '123',
        addressNeighborhood: 'Centro',
        addressCity: 'São Paulo',
        phone: '(11) 99999-8888',
        details: 'Pizza em dobro',
        promptInfo: {
            companyName: 'Audit Pizza',
            addressStreet: 'Rua das Flores',
            addressNumber: '123',
            addressNeighborhood: 'Centro',
            addressCity: 'São Paulo',
            phone: '(11) 99999-8888',
            details: 'Pizza em dobro'
        }
    };

    try {
        // Call Enhance Prompt (to check Director logic)
        console.log('📡 Chamando /api/enhance-prompt...');
        const start = Date.now();
        const enhanceRes = await axios.post(`${API_URL}/enhance-prompt`, businessInfo, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const duration = (Date.now() - start) / 1000;

        console.log(`⏱️ Tempo de resposta IA: ${duration}s`);
        const resultText = enhanceRes.data.enhancedPrompt || '';

        console.log('📝 Prompt Gerado (Snippet):', resultText.substring(0, 100) + '...');

        // Validar Idioma
        if (resultText.toLowerCase().includes('grand opening') || resultText.toLowerCase().includes('best pizza')) {
            console.error('❌ ALERTA: Texto em Inglês detectado no prompt!');
            report.language_check = false;
        } else {
            console.log('✅ Verificação Idioma: OK (Aparentemente PT-BR)');
            report.language_check = true;
        }

        // Check for Address Injection in Enhance Prompt?
        // Enhance prompt relies on prompt Info.
        if (resultText.includes('Rua das Flores') || resultText.includes('São Paulo')) {
            console.log('✅ Injeção de Endereço no Prompt: SUCESSO');
            report.address_injection = true;
        } else {
            console.warn('⚠️ Endereço não encontrado no prompt melhorado (Isso é normal se o robust block for apenas na Geração)');
            // We verify robust block in generation logs (or assumed logic since we cant see logs easily).
        }

    } catch (e) {
        console.error('❌ Erro Geração (Enhance):', e.response?.data || e.message);
    }

    // 4. TESTE DE EXECUÇÃO DE IMAGEM (/api/generate)
    console.log('\n--- 4. TESTE DE EXECUÇÃO DE IMAGEM (/api/generate) ---');
    console.log('⚠️ ESTE TESTE GERA UMA IMAGEM REAL E CONSOME QUOTA');

    try {
        const genRes = await axios.post(`${API_URL}/generate`, {
            ...businessInfo,
            selectedStyle: 'Digital Art',
            stylePrompt: 'Vibrant'
        }, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 120000 // 2 min
        });

        if (genRes.data.image) {
            console.log('✅ Imagem Gerada com Sucesso!');
            // Verificar se DB incrementou
            const { data: usageAfter } = await supabase.from('user_usage').select('images_generated').eq('user_id', userId).single();
            console.log(`📊 Créditos Usados: ${usageAfter.images_generated} (Esperado: 1)`);

            if (usageAfter.images_generated === 1) {
                console.log('✅ Contador de Créditos: FUNCIONOU');
            } else {
                console.error('❌ Contador de Créditos FALHOU');
            }
        }
    } catch (e) {
        console.log('⚠️ Geração Falhou (Pode ser timeout ou erro IA):', e.message);
    }

    // Cleanup
    console.log('\n🧹 Limpando usuário de teste...');
    await supabase.auth.admin.deleteUser(userId);
    console.log('✅ Limpeza concluída.');

    console.log('\n=== RELATÓRIO FINAL ===');
    console.log(JSON.stringify(report, null, 2));
}

runTests();
