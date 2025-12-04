const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load Env
const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing params:", { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY });
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncUsers() {
    console.log("🔍 Scanning for missing profiles...");

    // 1. Get all Auth Users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("❌ Auth Error:", authError.message);
        return;
    }
    console.log(`👤 Auth Users found: ${users.length}`);

    // 2. Get all Profiles
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('id');
    if (profileError) {
        console.error("❌ Profile Error:", profileError.message);
        return;
    }
    const profileIds = new Set(profiles.map(p => p.id));
    console.log(`📄 Profiles found: ${profiles.length}`);

    // 3. Find Missing
    const missingUsers = users.filter(u => !profileIds.has(u.id));

    if (missingUsers.length === 0) {
        console.log("✅ All users have profiles. System is consistent.");
        // Check if "usage" exists
        await checkusage(users.map(u => u.id));
        return;
    }

    console.log(`⚠️ Found ${missingUsers.length} users without profiles. Syncing now...`);

    // 4. Sync Missing
    for (const user of missingUsers) {
        const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            role: 'free',
            created_at: user.created_at
        });

        if (insertError) {
            console.error(`❌ Failed to sync ${user.email}:`, insertError.message);
        } else {
            console.log(`✅ Synced profile for: ${user.email}`);
        }
    }

    // 5. Re-check Usage
    await checkusage(users.map(u => u.id));
}

async function checkusage(userIds) {
    console.log("\n🔍 Checking User Usage quotas...");
    const { data: usages } = await supabase.from('user_usage').select('user_id');
    const usageIds = new Set(usages.map(u => u.user_id));

    const missingUsage = userIds.filter(id => !usageIds.has(id));

    if (missingUsage.length > 0) {
        console.log(`⚠️ Found ${missingUsage.length} users without usage records. Creating...`);
        for (const uid of missingUsage) {
            await supabase.from('user_usage').insert({ user_id: uid, images_generated: 0 });
            console.log(`✅ Created usage for ${uid}`);
        }
    } else {
        console.log("✅ All usage records exist.");
    }
}

syncUsers();
