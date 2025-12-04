const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const email = 'lucasformaggio@gmail.com';
    const password = 'mudar123';
    console.log(`🔧 Fixing Owner Account: ${email}`);

    try {
        let userId;

        // 1. Find User in Auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const authUser = users.find(u => u.email === email);

        if (authUser) {
            console.log(`✅ User found (ID: ${authUser.id}). Updating password...`);
            const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
                password: password,
                email_confirm: true
            });
            if (updateError) throw updateError;
            userId = authUser.id;
        } else {
            console.log(`🆕 Creating new Auth User...`);
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });
            if (createError) throw createError;
            userId = newUser.user.id;
        }

        // 2. Ensure Profile exists and is Owner
        // Note: 'profiles' table does NOT have email column
        const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                role: 'owner',
                first_name: 'Lucas',
                last_name: 'Admin'
            }, { onConflict: 'id' });

        if (upsertError) throw upsertError;

        console.log('------------------------------------------------');
        console.log('✅ SUCCESS!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('------------------------------------------------');

    } catch (e) {
        console.error('❌ CRITICAL ERROR:', e);
    }
}

run();
