const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSubscribe() {
    console.log('🚀 Testing Subscription Flow...');
    const baseUrl = 'http://localhost:3005/api';

    // 1. Get a test user token logic (simulate login)
    // Ideally we login, but here we can just sign a token if we had the secret, or simpler:
    // Use the `globalSupabase` in backend to bypass auth? No, endpoint checks `getAuthUser`.
    // I need a valid access token.
    // Let's use `signIn` with the test user credentials if possible.

    // Hardcoded test user email/pass? Or create one?
    // Let's use the one created manually or 'marcosfernandesrj97@gmail.com' if we know the password.

    // ALTERNATIVE: Use the manual "fix-usage" user ID and GENERATE a fake token? hard.

    // SIMPLEST: Re-use the existing valid session from the browser? Can't access.

    // BACKEND BYPASS: I'll temporarily add a debug route to Generate a Token? No, security risk.

    // Let's try to login as 'sevenbeatx@gmail.com' (dev) if password is known? No.

    // I will use `supabase.auth.signInWithPassword` with a NEW test user.
    const testEmail = `test.sub.${Date.now()}@test.com`;
    const testPass = 'password123';

    console.log(`👤 Creating test user: ${testEmail}`);
    const { data: signUpData, error: signError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPass
    });

    if (signError) {
        console.log('Signup error details:', JSON.stringify(signError, null, 2));
        console.log('Signup error message:', signError.message);
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPass
    });

    if (loginError || !loginData.session) {
        console.error('❌ Login failed:', loginError?.message);
        return;
    }

    const token = loginData.session.access_token;
    console.log('🔑 Authenticated!');

    try {
        const res = await axios.post(`${baseUrl}/subscribe`, {
            planId: 'starter',
            userId: loginData.user.id
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Subscription Init Point:', res.data.init_point);

        if (typeof res.data.init_point === 'string' && res.data.init_point.includes('mercadopago')) {
            console.log('🎉 PAYMENT FLOW VERIFIED!');
        } else {
            console.error('❌ Invalid Init Point');
        }

    } catch (e) {
        console.error('❌ Subscribe Error:', e.response?.data || e.message);
    }

    // Clean up test user
    await supabase.auth.admin.deleteUser(loginData.user.id);
    console.log('🧹 Test user cleaned up.');
}

testSubscribe();
