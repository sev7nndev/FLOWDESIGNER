#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const seedData = async () => {
  console.log('🌱 Inserindo dados de teste...');

  try {
    // Create test users
    const testUsers = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@flowdesigner.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        status: 'on'
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'owner@flowdesigner.com',
        first_name: 'Owner',
        last_name: 'User',
        role: 'owner',
        status: 'on'
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'cliente@flowdesigner.com',
        first_name: 'Cliente',
        last_name: 'Teste',
        role: 'free',
        status: 'on'
      }
    ];

    for (const user of testUsers) {
      const { error } = await supabase
        .from('profiles')
        .upsert(user, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Erro ao criar usuário ${user.email}:`, error);
      } else {
        console.log(`✅ Usuário ${user.email} criado/atualizado`);
      }
    }

    // Create test plans if they don't exist
    const { data: existingPlans } = await supabase
      .from('plans')
      .select('id, name');

    const planNames = existingPlans?.map(p => p.name) || [];
    
    const defaultPlans = [
      { name: 'Free', price: 0, image_quota: 3 },
      { name: 'Starter', price: 29.99, image_quota: 20 },
      { name: 'Pro', price: 49.99, image_quota: 50 }
    ];

    for (const plan of defaultPlans) {
      if (!planNames.includes(plan.name)) {
        const { error } = await supabase
          .from('plans')
          .insert(plan);
        
        if (error) {
          console.error(`❌ Erro ao criar plano ${plan.name}:`, error);
        } else {
          console.log(`✅ Plano ${plan.name} criado`);
        }
      }
    }

    // Create subscriptions for test users
    for (const user of testUsers) {
      if (user.role !== 'admin' && user.role !== 'owner') {
        const planName = user.role === 'free' ? 'Free' : user.role;
        
        const { data: plan } = await supabase
          .from('plans')
          .select('id')
          .eq('name', planName)
          .single();

        if (plan) {
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: user.id,
              plan_id: plan.id,
              status: 'active'
            }, { onConflict: 'user_id' });

          if (error) {
            console.error(`❌ Erro ao criar assinatura para ${user.email}:`, error);
          } else {
            console.log(`✅ Assinatura criada para ${user.email}`);
          }
        }
      }
    }

    console.log('\n🎉 Dados de teste inseridos com sucesso!');
    console.log('\n🔑 Credenciais para teste:');
    console.log('Admin: admin@flowdesigner.com');
    console.log('Owner: owner@flowdesigner.com');
    console.log('Cliente: cliente@flowdesigner.com');
    console.log('Senha para todos: 123456 (configure no Supabase Auth)');

  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
    process.exit(1);
  }
};

seedData();