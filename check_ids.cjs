const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkIds() {
    console.log("🔍 Verificando integridade Auth vs Profiles...");

    // 1. Pegar usuários do Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error("❌ Erro ao listar usuários Auth:", authError);
        return;
    }

    console.log(`📋 Encontrados ${users.length} usuários no Auth.`);

    // 2. Pegar perfis
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role');

    if (profileError) {
        console.error("❌ Erro ao listar perfis:", profileError);
        return;
    }

    // 3. Comparar
    console.log("\n--- COMPARAÇÃO ---");
    for (const user of users) {
        const profile = profiles.find(p => p.id === user.id);
        if (profile) {
            console.log(`✅ [OK] ${user.email} -> Profile ID bate (Role: ${profile.role})`);
        } else {
            console.error(`❌ [ERRO] ${user.email} (ID: ${user.id}) -> SEM PERFIL ASSOCIADO!`);
        }
    }
}

checkIds();
