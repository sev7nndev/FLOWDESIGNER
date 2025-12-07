/**
 * Script para configurar desenvolvedor (dev) do SaaS
 * Email: sevenbeatx@gmail.com
 * 
 * INSTRUÇÕES:
 * 1. Execute este script no Node.js
 * 2. Ele verificará se o usuário existe
 * 3. Se existir, atualizará para role 'dev'
 * 4. Se não existir, mostrará instruções
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const DEV_EMAIL = 'sevenbeatx@gmail.com';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Variáveis de ambiente faltando!');
    console.error('   Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setDev() {
    console.log('🔍 Procurando usuário:', DEV_EMAIL);

    try {
        // Buscar usuário na tabela auth.users usando Service Role
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('❌ Erro ao buscar usuários:', authError.message);
            return;
        }

        const targetUser = authUsers.users.find(u => u.email === DEV_EMAIL);

        if (!targetUser) {
            console.log('\n⚠️  USUÁRIO NÃO ENCONTRADO!');
            console.log('\n📋 INSTRUÇÕES:');
            console.log('1. Acesse o app: http://localhost:3000');
            console.log('2. Clique em "Sign Up"');
            console.log(`3. Crie uma conta com o email: ${DEV_EMAIL}`);
            console.log('4. Execute este script novamente');
            console.log('\nOU');
            console.log('5. Execute o SQL manualmente no Supabase SQL Editor:');
            console.log(`   UPDATE profiles SET role = 'dev' WHERE id = (SELECT id FROM auth.users WHERE email = '${DEV_EMAIL}');`);
            return;
        }

        console.log('✅ Usuário encontrado na tabela auth.users!');
        console.log('   ID:', targetUser.id);
        console.log('   Email:', targetUser.email);
        console.log('   Criado em:', new Date(targetUser.created_at).toLocaleString());

        // Buscar profile correspondente
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUser.id)
            .single();

        if (profileError) {
            console.error('❌ Erro ao buscar profile:', profileError.message);
            console.log('\n💡 Dica: O usuário existe no auth.users mas não tem profile.');
            console.log('   Tente fazer login uma vez para criar o profile automaticamente.');
            return;
        }

        console.log('✅ Profile encontrado!');
        console.log('   Role atual:', profile.role);
        console.log('   Nome:', profile.first_name, profile.last_name);

        if (profile.role === 'dev') {
            console.log('\n✅ Usuário já é DEV! Nada a fazer.');
            return;
        }

        console.log('\n🔄 Atualizando para role "dev"...');

        const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update({
                role: 'dev',
                updated_at: new Date().toISOString()
            })
            .eq('id', targetUser.id)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Erro ao atualizar:', updateError.message);
            return;
        }

        console.log('✅ SUCESSO! Usuário atualizado para DEV!');
        console.log('\n📊 Dados atualizados:');
        console.log('   ID:', updated.id);
        console.log('   Email:', DEV_EMAIL);
        console.log('   Role:', updated.role);
        console.log('   Atualizado em:', new Date(updated.updated_at).toLocaleString());

        console.log('\n🎉 PRONTO! O usuário', DEV_EMAIL, 'agora é DEV do SaaS!');
        console.log('\n📝 Permissões de DEV:');
        console.log('✅ Acesso ao Painel Administrativo');
        console.log('✅ Acesso ao Dev Panel (se implementado)');
        console.log('✅ Geração ilimitada de imagens (bypass de quota)');
        console.log('✅ Acesso a todas as configurações do sistema');

    } catch (error) {
        console.error('❌ Erro inesperado:', error.message);
    }
}

setDev().catch(console.error);
