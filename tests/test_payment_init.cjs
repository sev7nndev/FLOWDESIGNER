const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using Service Key to autocreate user for test
const apiUrl = 'http://localhost:3001';

async function testPayment() {
    console.log('🚀 Starting Payment Init Test...');

    // 1. Create Temporary User
    const email = `paytest_${Date.now()}@test.com`;
    const password = 'password123';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log(`Creating test user: ${email}...`);
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (createError) {
        console.error('Failed to create user:', createError.message);
        process.exit(1);
    }

    const userId = userData.user.id;
    console.log(`User created: ${userId}`);

    // 2. Login (to get Token for API)
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login failed:', loginError);
        process.exit(1);
    }

    const token = loginData.session.access_token;

    // 3. Request Subscription/Preference
    console.log('Requesting /api/subscribe (Plan: Pro)...');
    try {
        const response = await axios.post(`${apiUrl}/api/subscribe`, {
            planId: 'pro'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const { paymentUrl } = response.data;

        if (paymentUrl && paymentUrl.includes('mercadopago.com')) {
            console.log('✅ Success! Payment URL received:');
            console.log(paymentUrl);
        } else {
            console.error('❌ Failed. Invalid response:', response.data);
        }

    } catch (e) {
        console.error('API Request Failed:', e.response?.data || e.message);
    }

    // Cleanup (optional)
    await supabase.auth.admin.deleteUser(userId);
}

testPayment();
