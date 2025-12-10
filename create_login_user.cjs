
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Keys');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    // Create a known user
    const email = `ui_test_${Date.now()}@test.com`;
    const password = 'password123';

    console.log(`Creating user: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: 'UI', last_name: 'Tester' }
    });

    if (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    } else {
        console.log('✅ Created User');
        console.log(`EMAIL: ${email}`);
        console.log(`PASS: ${password}`);
        // Save to specific file for browser agent to read if needed, or just specific filename
        fs.writeFileSync('last_test_user.json', JSON.stringify({ email, password }));
    }
}

run();
