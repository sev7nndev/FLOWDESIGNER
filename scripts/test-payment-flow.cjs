const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPaymentFlow() {
  console.log('🧪 TESTANDO FLUXO DE PAGAMENTO\n');
  console.log('==========================================\n');

  // 1. Verificar tabela de pagamentos
  console.log('1️⃣ Verificando tabela de pagamentos...');
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (paymentsError) {
    console.error('❌ Erro ao buscar pagamentos:', paymentsError);
  } else {
    console.log(`✅ Total de pagamentos registrados: ${payments?.length || 0}`);
    if (payments && payments.length > 0) {
      console.log('\n📋 Últimos pagamentos:');
      payments.forEach((p, i) => {
        console.log(`${i + 1}. User: ${p.user_id.substring(0, 8)}... | Plano: ${p.plan} | Valor: R$ ${p.amount} | Status: ${p.status}`);
      });
    } else {
      console.log('⚠️ Nenhum pagamento registrado ainda');
    }
  }

  console.log('\n==========================================\n');

  // 2. Simular upgrade de plano
  console.log('2️⃣ Simulando upgrade de plano...');
  
  // Pegar um usuário FREE para testar
  const { data: freeUsers } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('role', 'free')
    .limit(1);

  if (!freeUsers || freeUsers.length === 0) {
    console.log('⚠️ Nenhum usuário FREE encontrado para teste');
    console.log('💡 Crie um usuário FREE primeiro para testar upgrade');
    return;
  }

  const testUser = freeUsers[0];
  console.log(`\n👤 Usuário de teste: ${testUser.email} (${testUser.role})`);

  // Verificar quota atual
  const { data: currentUsage } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', testUser.id)
    .single();

  console.log(`📊 Quota atual: ${currentUsage?.images_generated || 0} imagens geradas`);

  console.log('\n🔄 Simulando upgrade para STARTER...');
  
  // Simular o que o webhook faria
  const simulatedPayment = {
    user_id: testUser.id,
    amount: 29.90,
    status: 'approved',
    mercadopago_payment_id: 'TEST_' + Date.now(),
    plan: 'starter',
    paid_at: new Date().toISOString()
  };

  // Registrar pagamento
  const { error: insertError } = await supabase
    .from('payments')
    .insert(simulatedPayment);

  if (insertError) {
    console.error('❌ Erro ao registrar pagamento:', insertError);
    return;
  }

  console.log('✅ Pagamento registrado');

  // Atualizar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'starter' })
    .eq('id', testUser.id);

  if (profileError) {
    console.error('❌ Erro ao atualizar perfil:', profileError);
    return;
  }

  console.log('✅ Perfil atualizado para STARTER');

  // Reset de quota
  const { error: usageError } = await supabase
    .from('user_usage')
    .update({ cycle_start_date: new Date().toISOString() })
    .eq('user_id', testUser.id);

  if (usageError) {
    console.error('❌ Erro ao resetar quota:', usageError);
    return;
  }

  console.log('✅ Quota resetada');

  // Verificar resultado
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', testUser.id)
    .single();

  console.log(`\n🎉 UPGRADE COMPLETO!`);
  console.log(`   Plano anterior: FREE`);
  console.log(`   Plano atual: ${updatedProfile?.role?.toUpperCase()}`);
  console.log(`   Novo limite: 20 imagens/mês`);

  console.log('\n==========================================\n');
  console.log('✅ TESTE DE PAGAMENTO CONCLUÍDO COM SUCESSO!');
  console.log('\n💡 PRÓXIMO PASSO: Testar webhook real do Mercado Pago');
}

testPaymentFlow().catch(console.error);
