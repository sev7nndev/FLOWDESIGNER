const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkRoles() {
    const emails = ['lucasformaggio@gmail.com', 'sevenbeatx@gmail.com'];
    console.log('🕵️ CHECKING ROLES for Exempt Users...\n');

    const { data: authData } = await supabase.auth.admin.listUsers();

    for (const email of emails) {
        const user = authData.users.find(u => u.email === email);
        if (!user) {
            console.log(`❌ User ${email} NOT FOUND in Auth.`);
            continue;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log(`User: ${email}`);
        console.log(`ID: ${user.id}`);
        console.log(`Role: ${profile?.role || 'MISSING'}`);
        console.log('---------------------------');
    }
}

checkRoles();
