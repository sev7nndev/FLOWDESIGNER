const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testRegisterNoMeta() {
    const email = `test_nometa_${Date.now()}@example.com`;
    const password = 'password123';
    console.log(`Trying to register NO META ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // NO options.data
    });

    if (error) {
        console.error("SignUp Error:", error);
    } else {
        console.log("SignUp Success User ID:", data.user?.id);
    }
}

testRegisterNoMeta();
