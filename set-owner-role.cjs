const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Supabase credentials missing.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setOwnerRole() {
    const email = 'lucasformaggio@gmail.com';

    console.log(`Procurando usuário: ${email}...`);

    // Get user by email
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error("Erro ao listar usuários:", authError);
        return;
    }

    const user = authData.users.find(u => u.email === email);

    if (!user) {
        console.error(`❌ Usuário ${email} não encontrado no Auth.`);
        console.log("O usuário precisa fazer login primeiro para ser criado.");
        return;
    }

    console.log(`✅ Usuário encontrado: ${user.id}`);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') {
        console.error("Erro ao buscar perfil:", profileError);
        return;
    }

    if (!profile) {
        console.log("Perfil não existe. Criando...");
        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                first_name: 'Lucas',
                last_name: 'Formaggio',
                role: 'owner'
            });

        if (insertError) {
            console.error("❌ Erro ao criar perfil:", insertError);
            return;
        }

        console.log("✅ Perfil criado com role 'owner'!");
    } else {
        console.log(`Perfil existe. Role atual: ${profile.role}`);

        if (profile.role !== 'owner') {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'owner' })
                .eq('id', user.id);

            if (updateError) {
                console.error("❌ Erro ao atualizar role:", updateError);
                return;
            }

            console.log("✅ Role atualizada para 'owner'!");
        } else {
            console.log("✅ Role já está como 'owner'!");
        }
    }

    console.log("\n🎉 Tudo pronto! O usuário pode acessar o painel admin agora.");
}

setOwnerRole();
