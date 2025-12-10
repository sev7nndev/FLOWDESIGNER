const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SERVER_URL = 'http://localhost:3007'; // Ensure this matches running server
const API_URL = `${SERVER_URL}/api`;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Use Anon key for Auth client to simulate frontend behavior
// IMPORTANT: If VITE_ANON is missing in loaded envs, login fails.
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY; // Fallback to Service if Anon missing (for test only)

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = {};

function logResult(id, status, obs = '') {
    results[id] = { status, obs };
    console.log(`[${status ? '✅ OK' : '❌ FAIL'}] ${id}: ${obs}`);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function runProtocol() {
    console.log('📝 INICIANDO PROTOCOLO DE TESTES (SCRIPT AUTOMATIZADO) ...\n');

    // Debug Env
    console.log('🔑 Debug Keys:', {
        URL: SUPABASE_URL ? 'OK' : 'MISSING',
        SERVICE: SUPABASE_SERVICE_KEY ? 'OK' : 'MISSING',
        ANON: SUPABASE_ANON_KEY ? 'OK' : 'MISSING'
    });

    // Wait for server warm up
    console.log('⏳ Aguardando servidor responder (http://localhost:3007/api/health-check)...');
    let serverReady = false;
    for (let i = 0; i < 10; i++) {
        try {
            // Try api/health-check first as it might be what server.cjs exposes
            await axios.get(`${API_URL}/health-check`);
            console.log('✅ Servidor detectado (/api/health-check)!');
            serverReady = true;
            break;
        } catch (e) {
            try {
                // Fallback to /health
                await axios.get(`${SERVER_URL}/health`);
                console.log('✅ Servidor detectado (/health)!');
                serverReady = true;
                break;
            } catch (e2) {
                process.stdout.write('.');
                await delay(1000);
            }
        }
    }
    console.log('');

    if (!serverReady) {
        console.error('❌ Servidor não respondeu. Abortando.');
        logResult('1.1', false, 'Servidor Offline');
        // Continue anyway? No.
        process.exit(1);
    } else {
        logResult('1.1', true, 'Landing Page / Backend Acessível');
    }

    // --- SEÇÃO 1: CADASTRO ---
    console.log('--- SEÇÃO 1: CADASTRO ---');

    // 1.2 Cadastro Free
    const testUser = {
        email: `protocol_user_${Date.now()}@test.com`,
        password: 'Password123!',
        firstName: 'Protocol',
        lastName: 'Tester'
    };
    let userId = null;
    let token = null;

    try {
        // Register via API
        const regRes = await axios.post(`${API_URL}/register`, testUser);
        if (regRes.data.success || regRes.data.user) {
            userId = regRes.data.user?.id || regRes.data.session?.user?.id;

            // Login to get session
            const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
                email: testUser.email,
                password: testUser.password
            });

            if (authError) throw authError;
            token = authData.session.access_token;
            userId = authData.user.id; // Confirm ID from login

            // Check DB
            const { data: usage } = await supabaseAdmin.from('user_usage').select('*').eq('user_id', userId).single();
            const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();

            if (usage.images_generated === 0 && profile.role === 'free') {
                logResult('1.2', true, 'Usuário criado, Role=free, Credits=0 (consumidos)');
            } else {
                logResult('1.2', false, `DB Inconsistente: ${JSON.stringify(usage)}`);
            }
        }
    } catch (e) {
        logResult('1.2', false, `Falha Cadastro: ${e.response?.data?.error || e.message}`);
    }

    if (!token) {
        console.error('⛔ Impossível continuar sem Login.');
        process.exit(1);
    }

    // --- SEÇÃO 2: CRÉDITOS ---
    console.log('\n--- SEÇÃO 2: CRÉDITOS ---');

    // 2.1 Check Initial Quota via API
    try {
        const quotaRes = await axios.get(`${API_URL}/check-quota`, { headers: { Authorization: `Bearer ${token}` } });
        if (quotaRes.data.plan.id === 'free' && quotaRes.data.plan.max_images_per_month === 3) {
            logResult('2.1', true, `Kuota Inicial verificada (3)`);
        } else {
            logResult('2.1', false, `Kuota incorreta: ${JSON.stringify(quotaRes.data)}`);
        }
    } catch (e) {
        logResult('2.1', false, e.message);
    }

    // --- SEÇÃO 3: WEBHOOK PAGAMENTO (SIMULAÇÃO) ---
    console.log('\n--- SEÇÃO 3: WEBHOOK PAGAMENTO (SIMULAÇÃO) ---');
    try {
        console.log('⚠️ Simulando Webhook via DB Update direto');

        // Manually upgrade user to 'starter'
        await supabaseAdmin.from('profiles').update({ role: 'starter' }).eq('id', userId);
        // Reset usage/cycle
        await supabaseAdmin.from('user_usage').update({
            plan_id: 'starter',
            images_generated: 0,
            cycle_start_date: new Date().toISOString()
        }).eq('user_id', userId);

        // Verify Upgrade
        const { data: updatedProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).single();
        const { data: updatedUsage } = await supabaseAdmin.from('user_usage').select('*').eq('user_id', userId).single();

        if (updatedProfile.role === 'starter' && updatedUsage.plan_id === 'starter') {
            logResult('3.2', true, 'Upgrade para Starter aplicado com sucesso (Simulado via Admin)');
        } else {
            logResult('3.2', false, 'Falha no upgrade Starter');
        }

        // Check new limit (should be 20)
        const quotaRes = await axios.get(`${API_URL}/check-quota`, { headers: { Authorization: `Bearer ${token}` } });
        if (quotaRes.data.plan.max_images_per_month === 20) {
            logResult('3.2b', true, 'Limite atualizado para 20');
        } else {
            logResult('3.2b', false, `Limite incorreto: ${quotaRes.data.plan.max_images_per_month}`);
        }

    } catch (e) {
        logResult('3.2', false, e.message);
    }

    // --- SEÇÃO 5 & 6 & 8 & 12: GERAÇÃO E PROMPTS ---
    console.log('\n--- SEÇÃO 5, 6, 8, 12: GERAÇÃO REAL E VALIDAÇÃO DE PROMPT ---');

    const fullData = {
        companyName: "Lud Tec",
        addressStreet: "Rua Irene de Souza Pinto",
        addressNumber: "30",
        addressNeighborhood: "Parque das Nações",
        addressCity: "São Paulo",
        phone: "(11) 95301-7418",
        instagram: "@ludtec",
        details: "Conserto de Celular e Computador",
        promptInfo: {
            companyName: "Lud Tec",
            addressStreet: "Rua Irene de Souza Pinto",
            addressNumber: "30",
            addressNeighborhood: "Parque das Nações",
            addressCity: "São Paulo",
            phone: "(11) 95301-7418",
            instagram: "@ludtec",
            details: "Conserto de Celular e Computador"
        }
    };

    try {
        console.log('📡 Chamando /api/enhance-prompt...');
        const enhanceRes = await axios.post(`${API_URL}/enhance-prompt`, fullData, { headers: { Authorization: `Bearer ${token}` } });

        const prompt = enhanceRes.data.enhancedPrompt;
        console.log('📝 Prompt Gerado snippet:', prompt.substring(0, 100) + '...');

        // Validations
        const checks = [
            { id: '5.2.Name', check: prompt.includes('Lud Tec'), obs: 'Nome no Prompt' },
            { id: '5.2.Phone', check: prompt.includes('(11) 95301-7418'), obs: 'Telefone no Prompt' },
            { id: '8.1.Language', check: !prompt.toLowerCase().includes('grand opening'), obs: 'Sem inglês óbvio' }
        ];

        checks.forEach(c => logResult(c.id, c.check, c.obs));

        console.log('📡 Chamando /api/generate (Gerando Imagem Real)...');
        const genRes = await axios.post(`${API_URL}/generate`, {
            ...fullData,
            selectedStyle: '3D Render',
            stylePrompt: 'Tech'
        }, { headers: { Authorization: `Bearer ${token}` }, timeout: 120000 });

        if (genRes.data.image && genRes.data.image.image_url) {
            logResult('6.1', true, 'Imagem gerada com sucesso (URL retornada)');
        } else {
            logResult('6.1', false, 'Falha na geração: Sem URL');
        }

    } catch (e) {
        logResult('6.1', false, `Erro Geração: ${e.response?.data?.error || e.message}`);
    }

    // Cleanup
    try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log('\n🧹 Usuário de teste removido.');
    } catch (e) { }

    console.log('\n=== RESULTADOS TÉCNICOS ===');
    console.log(JSON.stringify(results, null, 2));
}

runProtocol();
