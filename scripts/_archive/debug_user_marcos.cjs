
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugMarcos() {
    console.log('🔍 Searching for "marcos"...');
    // Find User
    const { data: users } = await supabase.from('profiles').select('*').ilike('first_name', '%marcos%');

    if (!users || users.length === 0) {
        console.log('❌ No user named Marcos found.');
        return;
    }

    for (const user of users) {
        console.log(`\n👤 User Found: ${user.first_name} ${user.last_name} (${user.id})`);
        console.log(`   Email: ${user.email}`);

        // Check Usage
        const { data: usage } = await supabase.from('user_usage').select('*').eq('user_id', user.id).single();
        console.log(`   📊 Usage Table: ${usage?.current_usage || 0} / ${usage?.limit || '?'}`);

        // Check Images
        const { data: images, error: imgError } = await supabase.from('images').select('*').eq('user_id', user.id);
        const imgCount = images ? images.length : 0;
        console.log(`   🖼️ Images Table Count: ${imgCount}`);

        if (imgError) console.error('   ❌ Error fetching images:', imgError);

        if (usage?.current_usage > imgCount) {
            console.log('   ⚠️ DETECTED: Phanthom Usage! Usage > Images');
            console.log('   🛠️ ACTION: Fixing usage to match image count...');
            await supabase.from('user_usage').update({ current_usage: imgCount }).eq('user_id', user.id);
            console.log('   ✅ Usage Synced.');
        } else {
            console.log('   ✅ Usage matches Image count (or is lower).');
        }
    }
}

debugMarcos();
