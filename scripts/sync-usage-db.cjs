const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function syncUsage() {
    console.log('🔄 STARTING USAGE SYNC...');

    // 1. Get all users
    const { data: users, error: uError } = await supabase.auth.admin.listUsers();
    if (uError) {
        console.error('❌ Error fetching users:', uError);
        return;
    }

    console.log(`Checking ${users.users.length} users...`);

    for (const user of users.users) {
        const userId = user.id;
        const email = user.email;

        // 2a. Check Role (Skip Owner/Dev/Admin)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        const role = profile?.role || 'free';
        if (role === 'owner' || role === 'dev' || role === 'admin') {
            console.log(`⏩ Skipping ${email} (${role}) - Exempt from usage tracking.`);
            continue;
        }

        // 2b. Count actual images
        const { count: imageCount, error: cError } = await supabase
            .from('images')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (cError) {
            console.error(`❌ Error counting images for ${email}:`, cError);
            continue;
        }

        // 3. Get current usage record
        const { data: usageData, error: rError } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Handle missing record or read error (PGRST116 is 'Row not found')
        const currentRecordedUsage = usageData ? (usageData.current_usage || 0) : 0;

        // 4. SYNC LOGIC: If actual images > recorded usage, update it.
        // We do NOT decrease usage (user might have deleted images but usage still counts).
        // But if the user says "it's zero but I used it", and we find images, we MUST update.

        let newUsage = currentRecordedUsage;
        let needsUpdate = false;

        if (imageCount > currentRecordedUsage) {
            console.log(`⚠️ MISMATCH for ${email}: Recorded=${currentRecordedUsage}, Actual=${imageCount}. Syncing to ${imageCount}.`);
            newUsage = imageCount;
            needsUpdate = true;
        } else {
            // Optional: If recorded is 0 but we know they did something? No, trust image count usually.
            // console.log(`✅ ${email}: Synced (Recorded: ${currentRecordedUsage}, Images: ${imageCount})`);
        }

        if (needsUpdate || !usageData) {
            const payload = {
                user_id: userId,
                current_usage: newUsage,
                // Default to 'free' or existing? We assume 'free' if creating new, but better to check profile.
                // For now, simpler to just upsert current_usage.
                updated_at: new Date().toISOString()
            };

            // If new record, add cycle_start
            if (!usageData) {
                payload.cycle_start_date = new Date().toISOString();
                payload.plan_id = 'free'; // Default
                console.log(`📝 Creating NEW usage record for ${email}`);
            }

            const { error: upsertError } = await supabase
                .from('user_usage')
                .upsert(payload, { onConflict: 'user_id' });

            if (upsertError) console.error(`❌ Failed to update ${email}:`, upsertError);
            else console.log(`✅ Updated ${email} to usage: ${newUsage}`);
        }
    }

    console.log('✅ SYNC COMPLETE');
}

syncUsage();
