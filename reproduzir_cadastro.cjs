
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Service Role Key');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    const email = `debug_${Date.now()}@test.com`;
    console.log(`Trying to create user: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { first_name: 'Debug', last_name: 'User' }
    });

    if (error) {
        console.error('❌ FAILURE:', error);
    } else {
        console.log('✅ SUCCESS created user:', data.user.id);
        // Clean up
        await supabase.auth.admin.deleteUser(data.user.id);
    }
}

run();
