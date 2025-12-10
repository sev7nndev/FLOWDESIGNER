const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    const email = 'owner_ui_test@flow.com';
    const password = 'testpassword123';

    console.log(`Creating/Updating Owner: ${email}`);

    // 1. Create/Get User
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: 'Test', last_name: 'Owner' }
    });

    let userId = user?.id;

    if (createError) {
        // If exists, find id
        console.log('User exists or error:', createError.message);
        const { data: found } = await supabase.from('profiles').select('id').eq('email', email).single();
        if (found) userId = found.id;
    }

    if (!userId) {
        console.error('Could not determine User ID');
        process.exit(1);
    }

    // 2. Force Role to Owner
    const { error: updateError } = await supabase.from('profiles').update({ role: 'owner' }).eq('id', userId);

    if (updateError) console.error('Role update failed:', updateError);
    else console.log('✅ User set to OWNER role successfully.');
}

run();
