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
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:3005/api'; // Ensure port matches backend

console.log('DEBUG: Env paths:', envPath, envLocalPath);
console.log('DEBUG: SUPABASE_URL:', SUPABASE_URL ? 'FOUND' : 'MISSING');
console.log('DEBUG: SUPABASE_KEY:', SUPABASE_KEY ? 'FOUND' : 'MISSING');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials. Checked .env and .env.local');
    console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUpgradeFlow() {
    console.log('🚀 Starting Upgrade Flow Simulation...');

    // 1. Create unique user
    const email = `upgrade_test_${Date.now()}@test.com`;
    const password = 'password123';

    console.log(`👤 Creating user: ${email}...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: 'Test', last_name: 'Upgrade' } }
    });

    if (signUpError) {
        console.error('SignUp Error:', signUpError.message);
        return;
    }

    const token = signUpData.session.access_token;
    console.log('✅ User created & logged in.');

    // 2. Select Plan 'Pro' (Simulator)
    const planId = 'pro';
    console.log(`💳 Initiating subscription for plan: ${planId}...`);

    try {
        const response = await axios.post(`${API_URL}/subscribe`, {
            planId
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ /api/subscribe Success!');
        console.log('🔗 Init Point (Mercado Pago URL):', response.data.init_point ? response.data.init_point : 'MISSING');

        if (response.data.init_point && response.data.init_point.includes('mercadopago.com')) {
            console.log('🎉 TEST PASSED: Backend generated a valid Mercado Pago payment link.');
            console.log('   The frontend will redirect the user to this URL.');
        } else {
            console.error('❌ TEST FAILED: Invalid init_point received:', response.data);
        }

    } catch (error) {
        console.error('❌ /api/subscribe Failed:', error.message);
        if (error.response) {
            console.error('   Response Data:', error.response.data);
        }
    }
}

testUpgradeFlow();
