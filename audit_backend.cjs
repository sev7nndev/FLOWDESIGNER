const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'http://localhost:3001/api';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌ Faltam variáveis de ambiente (URL ou Service Key)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function log(msg, type = 'INFO') {
    const icons = { INFO: 'ℹ️', SUCCESS: '✅', ERROR: '❌', WARN: '⚠️' };
    console.log(`${icons[type] || ''} [${type}] ${msg}`);
}

async function runAudit() {
    log('Iniciando Auditoria de Backend...', 'INFO');

    const timestamp = Date.now();
    const email = `audit_${timestamp}@flow.test`;
    const password = 'Password123!';
    let userId = null;
    let token = null;

    // 1. Criar Usuário
    try {
        log(`Criando usuário de teste: ${email}...`);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Confirmar automaticamente
        });

        if (authError) throw authError;
        userId = authData.user.id;
        log(`Usuário criado: ${userId}`, 'SUCCESS');

        // Login para pegar token
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) throw loginError;
        if (!loginData.session) throw new Error("Sessão não retornada no login");

        token = loginData.session.access_token;
        log('Login realizado e Token obtido.', 'SUCCESS');

    } catch (e) {
        log(`Erro crítico no Auth: ${e.message}`, 'ERROR');
        process.exit(1);
    }

    // 2. Verificar Profile Inicial
    try {
        log('Verificando Perfil e Créditos Iniciais...');

        // Aguardar um pouco para triggers rodarem
        await new Promise(r => setTimeout(r, 2000));

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        // Tabela user_usage gerencia o uso
        const { data: usage } = await supabase.from('user_usage').select('*').eq('user_id', userId).single();

        if (profile) {
            log(`Profile encontrado. Role: ${profile.role} (Esperado: free ou user)`, 'INFO');
            if (profile.role === 'free' || profile.plan === 'free') log('Plano FREE confirmado.', 'SUCCESS');
        } else {
            log('Profile NÃO encontrado!', 'ERROR');
        }

        if (usage) {
            log(`Créditos Usados (images_generated): ${usage.images_generated}`, 'INFO');
            if (usage.images_generated === 0) log('Contador de uso inicial correto (0).', 'SUCCESS');
            else log(`Contador de uso incorreto: ${usage.images_generated}`, 'ERROR');
        } else {
            log('user_usage vazio - Se o sistema cria sob demanda, OK. Senão, WARN.', 'WARN');
        }

    } catch (e) {
        log(`Erro ao verificar dados: ${e.message}`, 'ERROR');
    }

    // 3. Teste de IA "Melhorar Prompt"
    try {
        log('Testando Endpoint /api/enhance-prompt (IA)...');

        const promptInfo = {
            companyName: 'Auditoria Tech',
            whatsapp: '(11) 99999-8888',
            details: 'Empresa de auditoria de software via IA.'
        };

        const res = await fetch(`${API_URL}/enhance-prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt: 'Flyer sobre auditoria', promptInfo })
        });

        if (res.ok) {
            const json = await res.json();
            if (json.enhancedPrompt && json.enhancedPrompt.includes('Auditoria Tech')) {
                log('IA Melhorar Prompt funcionou e incluiu dados da empresa!', 'SUCCESS');
            } else {
                log('IA respondeu mas prompt parece incompleto ou genérico.', 'WARN');
                if (json.enhancedPrompt) console.log('Prompt obtido (inicio):', json.enhancedPrompt.substring(0, 100));
            }
        } else {
            log(`Falha no Enhance Prompt: Status ${res.status}`, 'ERROR');
        }

    } catch (e) {
        log(`Erro ao chamar Enhance Prompt: ${e.message}`, 'ERROR');
    }

    // 4. Teste de Simulação de Upgrade (Manual via Banco) e Checagem de Quota
    try {
        log('Simulando Upgrade para PLANO PRO via Banco de Dados...');
        await supabase.from('profiles').update({ plan: 'pro' }).eq('id', userId);

        // Verificar atualização
        const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).single();
        if (profile && profile.plan === 'pro') {
            log('Plano atualizado para PRO no banco.', 'SUCCESS');

            // Verificar quota no endpoint
            log('Verificando Quota (Endpoint /api/check-quota)...');
            const quotaRes = await fetch(`${API_URL}/check-quota`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (quotaRes.ok) {
                const quotaJson = await quotaRes.json();
                log(`Quota Check: Status=${quotaJson.status}, Restante=${quotaJson.remaining}`, 'INFO');
                if (quotaJson.remaining > 10) log('Quota PRO reconhecida (limit > 3).', 'SUCCESS');
                else log('Quota PRO NÃO reconhecida (ainda está como free?).', 'ERROR');

            } else if (quotaRes.status === 404) {
                log('Endpoint /check-quota não encontrado (Talvez o frontend calcule localmente?)', 'WARN');
            } else {
                log(`Erro no Check Quota: ${quotaRes.status}`, 'ERROR');
            }

        } else {
            log('Falha ao atualizar plano no banco.', 'ERROR');
        }

    } catch (e) {
        log(`Erro no teste de Upgrade: ${e.message}`, 'ERROR');
    }

    log(`Auditoria Finalizada.`, 'INFO');
}

runAudit();
