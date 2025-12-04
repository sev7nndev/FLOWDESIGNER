const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST USE SERVICE KEY FOR ADMIN ACTIONS
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:3005/api';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Service Credentials');
    process.exit(1);
}

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const clientSupabase = createClient(SUPABASE_URL, ANON_KEY);

async function runMasterTest() {
    console.log('🤖 --- MASTER INTEGRATION TEST START --- 🤖');

    const timestamp = Date.now();
    const clientEmail = `client_${timestamp}@test.com`;
    const ownerEmail = `owner_${timestamp}@test.com`;
    const password = 'password123';

    try {
        // ---------------------------------------------------------
        // STEP 1: CLIENT SIGNUP & IMAGE GENERATION
        // ---------------------------------------------------------
        console.log(`\n📧 STEP 1: Creating Client (${clientEmail})...`);
        const { data: clientAuth, error: clientErr } = await clientSupabase.auth.signUp({
            email: clientEmail,
            password: password,
            options: { data: { first_name: 'Test', last_name: 'Client' } }
        });

        if (clientErr) throw new Error(`Client Signup Failed: ${clientErr.message}`);
        const clientToken = clientAuth.session.access_token;
        const clientId = clientAuth.user.id;
        console.log(`✅ Client ID: ${clientId}`);

        // Verify Initial Usage (Should be 0)
        const { data: usageBefore } = await adminSupabase.from('user_usage').select('*').eq('user_id', clientId).single();
        if (usageBefore && usageBefore.current_usage !== 0) throw new Error(`Initial usage not 0. Is: ${usageBefore.current_usage}`);
        console.log('✅ Initial Usage Verified: 0');

        // Generate Image
        console.log('\n🎨 STEP 2: Generating Image...');
        try {
            await axios.post(`${API_URL}/generate`, {
                promptInfo: {
                    companyName: "Master Test Co",
                    details: "A futuristic skyline",
                    phone: "123"
                },
                artStyle: "Cinematic"
            }, {
                headers: { 'Authorization': `Bearer ${clientToken}` }
            });
            console.log('✅ Image Request sent successfully.');
        } catch (e) {
            throw new Error(`Generation Failed: ${e.response?.data?.error || e.message}`);
        }

        // Verify Usage Increment
        const { data: usageAfter } = await adminSupabase.from('user_usage').select('*').eq('user_id', clientId).single();
        if (usageAfter.current_usage !== 1) throw new Error(`Usage did not increment! Is: ${usageAfter.current_usage}`);
        console.log('✅ Accounting Verified: Usage incremented to 1.');


        // ---------------------------------------------------------
        // STEP 2: OWNER SIGNUP & PROMOTION
        // ---------------------------------------------------------
        console.log(`\n👑 STEP 3: Creating Mock Owner (${ownerEmail})...`);
        const { data: ownerAuth, error: ownerErr } = await clientSupabase.auth.signUp({
            email: ownerEmail,
            password: password,
            options: { data: { first_name: 'Test', last_name: 'Owner' } }
        });
        if (ownerErr) throw new Error(`Owner Signup Failed: ${ownerErr.message}`);

        let ownerToken = ownerAuth.session?.access_token;
        if (!ownerToken) {
            const { data: signIn } = await clientSupabase.auth.signInWithPassword({ email: ownerEmail, password });
            if (!signIn.session) throw new Error("Could not login as Owner.");
            ownerToken = signIn.session.access_token;
        }
        const ownerId = ownerAuth.user?.id || (await clientSupabase.auth.getUser(ownerToken)).data.user.id;

        // Promote to Owner via Admin
        await adminSupabase.from('profiles').update({ role: 'owner' }).eq('id', ownerId);
        console.log(`✅ User promoted to OWNER role.`);


        // ---------------------------------------------------------
        // STEP 3: FINANCIAL ACCOUNTING TEST
        // ---------------------------------------------------------
        console.log('\n💰 STEP 4: Injecting Mock Payment ($100.00)...');

        // Explicitly check for error on insert
        const { error: insertErr } = await adminSupabase.from('payments').insert({
            user_id: clientId,
            amount: 100.00,
            status: 'approved',
            paid_at: new Date().toISOString(),
            mercadopago_payment_id: `mock_${timestamp}`,
            plan: 'pro'
        });

        if (insertErr) {
            console.error("DEBUG: Insert Payment Error:", insertErr);
            throw new Error(`Payment Insert Failed: ${insertErr.message}`);
        }
        console.log('✅ Payment Inserted.');

        console.log('📊 STEP 5: Verifying Owner Panel Stats...');
        try {
            const statsRes = await axios.get(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${ownerToken}` }
            });

            const revenue = statsRes.data.revenue;
            const payments = statsRes.data.payments;

            console.log('   Stats Received:', JSON.stringify(revenue));
            console.log(`   Payments Count in Response: ${payments.length}`);

            if (payments.length > 0) {
                console.log('   Sample Payment:', JSON.stringify(payments[0]));
            } else {
                console.warn('   ⚠️ No payments returned in API response.');
            }

            if (revenue.total >= 100) {
                console.log('✅ Accounting Checked: Revenue reflects the payment.');
            } else {
                throw new Error(`Revenue mismatch. Expected >= 100, got ${revenue.total}`);
            }

        } catch (e) {
            throw new Error(`Owner Stats Failed: ${e.response?.data?.error || e.message}`);
        }

        console.log('\n🎉 --- ALL SYSTEMS GO: SYSTEM INTEGRITY 100% --- 🎉');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

runMasterTest();
