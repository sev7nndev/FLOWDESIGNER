const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const email = 'lucasformaggio@gmail.com';
    const newPassword = process.argv[2];

    if (!newPassword) {
        console.error('\n❌ ERRO: Você precisa fornecer a senha nova.');
        console.log('📌 Uso: node scripts/set_owner_password.cjs "SUA_SENHA_AQUI"\n');
        process.exit(1);
    }

    console.log(`🔧 Definindo nova senha para: ${email}`);

    try {
        // Find User
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const authUser = users.find(u => u.email === email);

        if (!authUser) {
            console.error('❌ Usuário não encontrado no sistema.');
            return;
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
            password: newPassword,
            email_confirm: true
        });

        if (updateError) throw updateError;

        console.log('------------------------------------------------');
        console.log('✅ SENHA ATUALIZADA COM SUCESSO!');
        console.log(`📧 Conta: ${email}`);
        console.log('🔑 Nova senha definida.');
        console.log('------------------------------------------------');

    } catch (e) {
        console.error('❌ ERRO CRÍTICO:', e.message);
    }
}

run();
