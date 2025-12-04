
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase Credentials");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const API_URL = 'http://localhost:3005';

async function runAudit() {
    console.log("🔍 Starting Comprehensive SaaS Audit...");

    // 1. User Registration (Free)
    const email = `audit_${Date.now()}@test.com`;
    const password = 'password123';
    console.log(`\n1️⃣ Testing Registration: ${email}`);

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    if (authError) {
        console.error("❌ Signup Failed:", authError.message);
        return;
    }
    console.log("✅ User Signed Up via Supabase Auth");

    // Get Session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (sessionError || !sessionData.session) {
        console.error("❌ Login Failed:", sessionError?.message);
        return;
    }
    const token = sessionData.session.access_token;
    const userId = sessionData.user.id;
    console.log("✅ User Logged In (Token Acquired)");

    // 2. Image Generation (Senior Designer Check)
    console.log("\n2️⃣ Testing Image Generation (Senior Designer Flow)...");

    const promptPayload = {
        promptInfo: {
            nomeEmpresa: "Oficina E2E Test",
            briefing: "Troca de óleo R$ 99. Promoção imperdível.",
            whatsapp: "11999999999",
            rua: "Rua Teste 123"
        }
    };

    try {
        const genRes = await axios.post(`${API_URL}/api/generate`, promptPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (genRes.data.image) {
            console.log("✅ Image Generated Successfully!");
            console.log("   URL:", genRes.data.image.image_url);
        } else {
            console.error("❌ Image Verification Failed (No data).");
        }
    } catch (e) {
        console.error("❌ Generation Request Failed:", e.response?.data || e.message);
    }

    // 3. Quota Enforcement
    console.log("\n3️⃣ Testing Quota Enforcement (Looping)...");
    // We already did 1. Limit is 3. run 3 more times.
    let hitLimit = false;
    for (let i = 0; i < 4; i++) {
        try {
            console.log(`   Attempt ${i + 2}...`);
            await axios.post(`${API_URL}/api/generate`, promptPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {
            if (e.response?.status === 403) {
                console.log("✅ Quota Limit Hit as Expected (403 Forbidden).");
                hitLimit = true;
                break;
            }
        }
    }

    if (!hitLimit) console.warn("⚠️ Quota Check: User was able to generate more than limit!");

    // Load Service Key for Admin Actions
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

    // 4. Payments & Upgrades (Simulation via Admin)
    console.log("\n4️⃣ Testing Upgrade logic (Admin Override)...");

    const { error: updateError } = await adminClient
        .from('profiles')
        .update({ role: 'pro' })
        .eq('id', userId);

    if (updateError) {
        console.error("❌ Failed to update role:", updateError.message);
    } else {
        console.log("✅ User manually upgraded to PRO via Admin.");

        // Insert Fake Payment to test Owner Panel
        await adminClient.from('payments').insert({
            user_id: userId,
            amount: 199.90,
            status: 'approved',
            payment_method: 'credit_card',
            mp_payment_id: `test_audit_${Date.now()}`,
            paid_at: new Date().toISOString()
        });
        console.log("✅ Fake Payment Inserted ($199.90)");

        // Try generate again
        try {
            console.log("   Attempting generation as PRO (Should succeed)...");
            await axios.post(`${API_URL}/api/generate`, promptPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("✅ PRO Generation Successful (Quota Released).");
        } catch (e) {
            console.error("❌ PRO Generation Failed:", e.response?.data || e.message);
        }
    }

    // 5. Test Owner Panel Stats
    console.log("\n5️⃣ Testing Owner Panel Stats...");
    const { data: payments } = await adminClient.from('payments').select('*').eq('status', 'approved');
    const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    console.log(`✅ Total Revenue in DB: R$ ${revenue.toFixed(2)} (Verified Access).`);

    console.log("\n🏁 Audit Complete.");
}

runAudit();
