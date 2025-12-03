require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createTestUsers = async () => {
  console.log('🔧 Criando usuários de teste...');

  const testUsers = [
    {
      email: 'admin@flowdesigner.com',
      password: '123456',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    },
    {
      email: 'dev@flowdesigner.com',
      password: '123456',
      firstName: 'Dev',
      lastName: 'User',
      role: 'dev'
    },
    {
      email: 'owner@flowdesigner.com',
      password: '123456',
      firstName: 'Owner',
      lastName: 'User',
      role: 'owner'
    }
  ];

  for (const user of testUsers) {
    try {
      console.log(`📝 Criando usuário: ${user.email}`);
      
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`ℹ️  Usuário ${user.email} já existe, tentando fazer login para obter o ID...`);
          
          // Tentar fazer login para obter o ID do usuário
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password
          });
          
          if (loginError) {
            console.error(`❌ Erro ao fazer login com ${user.email}:`, loginError.message);
            continue;
          }
          
          // Criar/atualizar perfil
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: loginData.user.id,
              role: user.role,
              status: 'on',
              first_name: user.firstName,
              last_name: user.lastName
            }, { onConflict: 'id' });
          
          if (profileError) {
            console.error(`❌ Erro ao criar perfil para ${user.email}:`, profileError.message);
          } else {
            console.log(`✅ Perfil atualizado para ${user.email}`);
          }
        } else {
          console.error(`❌ Erro ao criar usuário ${user.email}:`, authError.message);
        }
        continue;
      }

      console.log(`✅ Usuário ${user.email} criado com ID: ${authData.user.id}`);

      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role: user.role,
          status: 'on',
          first_name: user.firstName,
          last_name: user.lastName
        });

      if (profileError) {
        console.error(`❌ Erro ao criar perfil para ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Perfil criado para ${user.email}`);
      }

    } catch (error) {
      console.error(`❌ Erro ao processar usuário ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 Usuários de teste criados com sucesso!');
  console.log('\n🔑 Credenciais para teste:');
  console.log('=====================================');
  console.log('Admin: admin@flowdesigner.com');
  console.log('Dev: dev@flowdesigner.com');
  console.log('Owner: owner@flowdesigner.com');
  console.log('=====================================');
  console.log('Senha para todos: 123456');
};

createTestUsers();