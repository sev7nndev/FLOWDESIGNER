const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load Env matches server logic
const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Env Vars:\nURL:', !!SUPABASE_URL, '\nServiceKey:', !!SUPABASE_SERVICE_KEY);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkDB() {
    console.log('🔍 Checking Database...');

    // 1. Check Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) console.error('❌ Profiles Error:', pError.message);
    else {
        console.log(`✅ Profiles Found: ${profiles.length}`);
        console.table(profiles.map(p => ({
            email: p.email,
            role: p.role,
            id: p.id.substring(0, 6) + '...'
        })));
    }

    // 2. Check Auth Users (Requires Admin API which uses SERVICE_KEY)
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
    if (uError) console.error('❌ Auth Error:', uError.message);
    else {
        console.log(`✅ Auth Users Found: ${users.length}`);
        console.table(users.map(u => ({
            email: u.email,
            id: u.id.substring(0, 6) + '...'
        })));
    }

    // 3. Mismatches
    if (profiles && users) {
        const profileIds = new Set(profiles.map(p => p.id));
        const missingProfiles = users.filter(u => !profileIds.has(u.id));

        if (missingProfiles.length > 0) {
            console.log('\n⚠️  WARNING: The following Auth Users have NO Profile entry (This is why they are missing from the panel):');
            missingProfiles.forEach(u => console.log(`- ${u.email} (${u.id})`));
        } else {
            console.log('\n✅ Data Consistency: All Auth Users have Profiles.');
        }
    }
}

checkDB();
