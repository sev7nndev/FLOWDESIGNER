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

async function fixUsage() {
    const targetEmail = 'marcosfernandesrj97@gmail.com';
    console.log(`🔧 Looking up user by email: ${targetEmail}`);

    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users?.find(u => u.email === targetEmail);

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    const userId = user.id;
    console.log(`✅ Found User ID: ${userId}`);

    const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching usage:', error);
        return;
    }

    let currentUsage = 0;
    if (data) {
        currentUsage = data.current_usage || 0;
        console.log(`Current usage: ${currentUsage}`);
        if (currentUsage < 1) {
            console.log('Updating usage to 1...');
            const { error: updateError } = await supabase
                .from('user_usage')
                .update({ current_usage: 1, updated_at: new Date().toISOString() })
                .eq('user_id', userId);

            if (updateError) console.error('❌ Update failed:', updateError);
            else console.log('✅ Updated usage to 1');
        } else {
            console.log('✅ Usage already correct or higher.');
        }
    } else {
        console.log('Creating new usage record...');
        const { error: insertError } = await supabase
            .from('user_usage')
            .insert({
                user_id: userId,
                current_usage: 1,
                cycle_start_date: new Date().toISOString()
            });

        if (insertError) console.error('❌ Insert failed:', insertError);
        else console.log('✅ Inserted usage: 1');
    }
}

fixUsage();
