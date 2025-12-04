const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const email = 'lucasformaggio@gmail.com';
    console.log(`🔧 Configurando role OWNER para: ${email}`);

    try {
        // 1. Find User in Auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const authUser = users.find(u => u.email === email);

        if (!authUser) {
            console.error('❌ Usuário não encontrado no Auth do Supabase.');
            console.log('📌 Certifique-se de que o usuário foi criado no Supabase Auth.');
            return;
        }

        console.log(`✅ Usuário encontrado (ID: ${authUser.id})`);

        // 2. Update/Create Profile with OWNER role (WITHOUT touching password)
        const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
                id: authUser.id,
                role: 'owner',
                first_name: 'Lucas',
                last_name: 'Admin'
            }, { onConflict: 'id' });

        if (upsertError) throw upsertError;

        console.log('------------------------------------------------');
        console.log('✅ SUCCESS!');
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Role: OWNER`);
        console.log(`🔑 Senha: (mantida como estava no Supabase)`);
        console.log('------------------------------------------------');
        console.log('Agora você pode fazer login com a senha que cadastrou!');

    } catch (e) {
        console.error('❌ ERRO:', e.message);
    }
}

run();
