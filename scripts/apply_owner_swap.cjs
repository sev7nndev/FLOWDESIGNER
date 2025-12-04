const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const sql = fs.readFileSync(path.join(__dirname, '../sql/swap_saas_owner.sql'), 'utf8');
    console.log('Running SQL...');

    // We can't run raw SQL from client easily without RPC, but we can do the equivalent query logic in JS for simplicity OR assume an RPC exists.
    // Actually, I can just do the text update logic here using the client to be safer.

    const email = 'lucasformaggio@gmail.com';

    // 1. Demote others
    const { error: demoteError } = await supabase
        .from('profiles')
        .update({ role: 'pro' })
        .eq('role', 'owner')
        .neq('email', email);

    if (demoteError) console.error('Demote Error:', demoteError);
    else console.log('Demoted old owners.');

    // 2. Promote Target
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .single();

    if (userError) {
        console.error('Target user not found or error:', userError);
        return;
    }

    const { error: promoteError } = await supabase
        .from('profiles')
        .update({ role: 'owner' })
        .eq('id', user.id);

    if (promoteError) console.error('Promote Error:', promoteError);
    else console.log(`Promoted ${email} to OWNER.`);
}

run();
