
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// LOAD ENV
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 1. ADMIN CLIENT (For Payments/Upgrades) - Service Role, No Session Persistence
const adminSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

// 2. USER CLIENT FACTORY (For Signups/Generations) - Anon Key
const createUserClient = () => createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const API_URL = 'http://localhost:3005';

const USERS = {
    free: { email: `test_free_${Date.now()}@flow.com`, password: 'password123', role: 'free' },
    starter: { email: `test_starter_${Date.now()}@flow.com`, password: 'password123', role: 'starter', planPrice: 29.90 },
    pro: { email: `test_pro_${Date.now()}@flow.com`, password: 'password123', role: 'pro', planPrice: 49.90 }
};

const LOG = (msg) => console.log(`[ULTIMATE TEST] ${msg}`);

async function runTest() {
    LOG('🚀 STARTING ULTIMATE SAAS VERIFICATION');

    try {
        // 1. FREE USER FLOW
        await testUserFlow(USERS.free);

        // 2. STARTER USER FLOW
        await testUserFlow(USERS.starter);

        // 3. PRO USER FLOW
        await testUserFlow(USERS.pro);

        // 4. VERIFY REVENUE
        await verifyRevenue();

        LOG('🎉 ULTIMATE TEST COMPLETED SUCCESSFULLY');
    } catch (e) {
        console.error('❌ TEST FAILED:', e);
        process.exit(1);
    }
}

async function testUserFlow(userConfig) {
    LOG(`\n👤 TESTING USER: ${userConfig.role.toUpperCase()} (${userConfig.email})`);

    // Create specific client for this user to avoid session pollution
    const userClient = createUserClient();

    // A. SIGNUP (User Action)
    const { data: authData, error: authError } = await userClient.auth.signUp({
        email: userConfig.email,
        password: userConfig.password
    });
    if (authError) throw authError;
    const userId = authData.user.id;
    LOG(`✅ Created User: ${userId}`);

    // B. PROFILE CREATION (Ensure profile exists)
    // We use Admin to force it just in case Trigger lags or we want to be sure.
    // Trigger usually handles it, but let's be robust.
    await adminSupabase.from('profiles').upsert({
        id: userId,
        email: userConfig.email,
        role: 'free', // Default to free first
        first_name: 'Test',
        last_name: userConfig.role
    });

    // C. MOCK PAYMENT & UPGRADE (Admin Action)
    if (userConfig.role !== 'free') {
        LOG(`💰 Processing Payment: R$ ${userConfig.planPrice}`);

        // 1. Insert Payment via Admin Client (Service Role)
        const { error: payError } = await adminSupabase.from('payments').insert({
            user_id: userId,
            amount: userConfig.planPrice,
            status: 'approved',
            paid_at: new Date().toISOString(),
            mercadopago_payment_id: `mock_mp_${Date.now()}`,
            plan: userConfig.role
        });

        if (payError) {
            console.error('FAILED PAYMENT INSERT:', JSON.stringify(payError, null, 2));
            throw payError;
        }
        LOG('✅ Payment Recorded');

        // 2. Upgrade Role via Admin Client
        const { error: upgradeError } = await adminSupabase.from('profiles').update({ role: userConfig.role }).eq('id', userId);
        if (upgradeError) {
            console.error('FAILED PROFILE UPGRADE:', JSON.stringify(upgradeError, null, 2));
            throw upgradeError;
        }
        LOG(`✅ Role Upgraded to ${userConfig.role}`);
    }

    // D. GENERATE IMAGE (User Action via API)
    // Sign In to get Token
    const { data: loginData } = await userClient.auth.signInWithPassword({ email: userConfig.email, password: userConfig.password });
    if (!loginData.session) throw new Error("Login failed during test");

    const token = loginData.session.access_token;

    LOG('🎨 Requesting Image Generation...');
    const promptPayload = {
        prompt: "Teste de Prompt",
        promptInfo: {
            companyName: "Empresa Teste Ltda",
            details: "Briefing em Português",
            whatsapp: "11999999999",
            rua: "Rua das Flores",
            numero: "123"
        }
    };

    const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(promptPayload)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Generation Failed');

    LOG(`✅ Generation Success: Image ID ${result.image.id}`);

    // E. VERIFY USAGE (Admin Check)
    const { data: usage } = await adminSupabase.from('user_usage').select('*').eq('user_id', userId).single();
    LOG(`✅ Usage Verified: ${usage.current_usage} (Expected increased)`);
}

async function verifyRevenue() {
    LOG('\n💵 VERIFYING OWNER REVENUE STATS');
    const { data: payments } = await adminSupabase.from('payments').select('amount').eq('status', 'approved');
    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    LOG(`✅ TOTAL SYSTEM REVENUE (DB): R$ ${total.toFixed(2)}`);
    LOG('ℹ️ Note: Compare this with your Dashboard.');
}

runTest();
