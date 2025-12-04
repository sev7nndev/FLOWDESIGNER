const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function audit() {
    console.log('🕵️ AUDITING USAGE DATA vs ACTUAL IMAGES\n');

    // 1. Get all profiles (users)
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, role');
    if (pError) console.error('Error fetching profiles:', pError);

    // Get Auth Users for emails
    const { data: authData, error: aError } = await supabase.auth.admin.listUsers();
    const users = authData?.users || [];

    const { data: usages, error: uError } = await supabase.from('user_usage').select('*');
    if (uError) console.error('Error fetching usage:', uError);

    console.log('--- USER REPORT ---');
    for (const user of profiles || []) {
        // Get email
        const authUser = users.find(u => u.id === user.id);
        const email = authUser?.email || 'Unknown';

        // Get usage record
        const matchingUsages = usages?.filter(u => u.user_id === user.id) || [];
        const usage = matchingUsages[0];

        if (matchingUsages.length > 1) {
            console.log(`🚨 ALERT: Found ${matchingUsages.length} usage records for this user!`);
            matchingUsages.forEach(r => console.log(`   - ID: ${r.id}, Usage: ${r.current_usage}`));
        }

        // Count actual images
        const { count, error: cError } = await supabase
            .from('images')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        console.log(`User: ${email} (${user.id})`);
        console.log(`Role: ${user.role}`);
        console.log(`DB Usage Record (current_usage): ${usage?.current_usage ?? 'MISSING'}`);
        console.log(`Actual Images in Table: ${count}`);

        if (usage?.current_usage !== count) {
            console.log('⚠️ MISMATCH DETECTED!');
        }
        console.log('-----------------------------------');
    }
}

audit();
