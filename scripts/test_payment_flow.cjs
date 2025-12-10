const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// CONFIG
const API_URL = 'http://localhost:3001/api/test-webhook'; // Use the sandbox route for safety or mock real webhook
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service key to check DB

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
    console.log('💳 STARTING PAYMENT FLOW TEST...');

    // 1. Create a Test User (or find one)
    console.log('👤 Fetching/Creating Test User...');
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1)
        .maybeSingle();

    if (!user) {
        console.error('❌ No users found in DB. Please create a user first.');
        process.exit(1);
    }
    console.log(`   Target User: ${user.email} (${user.id})`);

    // 2. Simulate "Approved" Webhook
    console.log('📡 Simulating Webhook (Approved - PRO Plan)...');
    try {
        const payload = {
            action: 'payment.created',
            data: { id: `TEST-${Date.now()}` }, // Fake ID
            // The /test-webhook route we built earlier creates a fake log and updates the user
            // We are testing that flow now.
            status: 'approved',
            plan: 'pro',
            user_id: user.id,
            email: user.email // Send email for logging clarity
        };

        const res = await axios.post(API_URL, payload);
        console.log('   Webhook Response:', res.status, res.statusText);
        
        if (res.status !== 200) throw new Error('Webhook failed');

    } catch (e) {
        console.error('❌ Webhook Request Failed:', e.message);
        if (e.response) console.error(e.response.data);
        process.exit(1);
    }

    // 3. Verify DB Update
    console.log('🔍 Verifying Database State...');
    
    // Wait a moment for async DB write
    await new Promise(r => setTimeout(r, 2000));

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile.role === 'pro') {
        console.log('✅ User Role updated to PRO!');
    } else {
        console.error(`❌ User Role is ${profile.role}, expected PRO.`);
    }

    // 4. Verify Payment Log
    const { data: logs } = await supabase
        .from('payment_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

    if (logs && logs.length > 0) {
        console.log('✅ Payment Log found.');
    } else {
        console.error('❌ No Payment Log found.');
    }

    console.log('🎉 PAYMENT TEST COMPLETE.');
}

runTest();
