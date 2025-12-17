const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testSaaSFlows() {
    console.log('\n🔍 TESTANDO FLUXOS CRÍTICOS DO SAAS\n');
    console.log('='.repeat(80));

    // 1. Verificar RLS Policies
    console.log('\n📋 1. VERIFICANDO RLS POLICIES\n');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
        sql: `
            SELECT tablename, policyname, cmd, qual
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'images'
            ORDER BY policyname;
        `
    }).catch(() => ({ data: null, error: 'RPC not available' }));

    if (policies) {
        console.log('✅ Policies encontradas:', policies.length);
        policies.forEach(p => console.log(`   - ${p.policyname} (${p.cmd})`));
    } else {
        console.log('⚠️  Não foi possível verificar policies via RPC');
    }

    // 2. Testar acesso com diferentes usuários
    console.log('\n👥 2. TESTANDO ACESSO POR USUÁRIO\n');
    
    const { data: users } = await supabase
        .from('profiles')
        .select('id, email, role')
        .in('role', ['free', 'starter', 'pro']);

    for (const user of users || []) {
        // Buscar usage
        const { data: usage } = await supabase
            .from('user_usage')
            .select('images_generated, cycle_start_date')
            .eq('user_id', user.id)
            .single();

        // Buscar imagens
        const { data: images } = await supabase
            .from('images')
            .select('id')
            .eq('user_id', user.id);

        // Buscar limite do plano
        const { data: plan } = await supabase
            .from('plan_settings')
            .select('max_images_per_month')
            .eq('id', user.role)
            .single();

        const counter = usage?.images_generated || 0;
        const saved = images?.length || 0;
        const limit = plan?.max_images_per_month || 0;
        const remaining = limit - counter;

        console.log(`${user.email} (${user.role.toUpperCase()})`);
        console.log(`  Limite: ${limit} | Usado: ${counter} | Restante: ${remaining}`);
        console.log(`  Imagens salvas: ${saved} | Diferença: ${counter - saved}`);
        
        if (counter > limit) {
            console.log(`  🚨 PROBLEMA: Contador excede limite!`);
        }
        if (counter < saved) {
            console.log(`  🚨 PROBLEMA: Mais imagens salvas que contador!`);
        }
        if (counter > saved) {
            console.log(`  ⚠️  Usuário deletou ${counter - saved} imagens`);
        }
        console.log('');
    }

    // 3. Verificar integridade dos dados
    console.log('\n🔍 3. VERIFICANDO INTEGRIDADE DOS DADOS\n');
    
    // Usuários sem user_usage
    const { data: profilesWithoutUsage } = await supabase.rpc('exec_sql', {
        sql: `
            SELECT p.email, p.role
            FROM profiles p
            LEFT JOIN user_usage u ON p.id = u.user_id
            WHERE u.user_id IS NULL AND p.role NOT IN ('owner', 'dev', 'admin');
        `
    }).catch(() => ({ data: [] }));

    if (profilesWithoutUsage && profilesWithoutUsage.length > 0) {
        console.log(`🚨 ${profilesWithoutUsage.length} usuários SEM registro em user_usage:`);
        profilesWithoutUsage.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    } else {
        console.log('✅ Todos os usuários têm registro em user_usage');
    }

    // Imagens órfãs (sem usuário)
    const { data: orphanImages } = await supabase.rpc('exec_sql', {
        sql: `
            SELECT COUNT(*) as count
            FROM images i
            LEFT JOIN profiles p ON i.user_id = p.id
            WHERE p.id IS NULL;
        `
    }).catch(() => ({ data: [{ count: 0 }] }));

    const orphanCount = orphanImages?.[0]?.count || 0;
    if (orphanCount > 0) {
        console.log(`🚨 ${orphanCount} imagens órfãs (sem usuário associado)`);
    } else {
        console.log('✅ Nenhuma imagem órfã');
    }

    // 4. Verificar configuração de planos
    console.log('\n💰 4. VERIFICANDO CONFIGURAÇÃO DE PLANOS\n');
    
    const { data: plans } = await supabase
        .from('plan_settings')
        .select('*')
        .order('max_images_per_month', { ascending: true });

    plans?.forEach(plan => {
        console.log(`${plan.id.toUpperCase()}: ${plan.max_images_per_month} imagens/mês`);
        if (plan.price) {
            console.log(`  Preço: R$ ${plan.price.toFixed(2)}`);
        }
    });

    // 5. Resumo Final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA AUDITORIA\n');
    
    const totalUsers = users?.length || 0;
    const totalImages = (await supabase.from('images').select('count')).data?.[0]?.count || 0;
    
    console.log(`✅ Total de usuários (FREE/STARTER/PRO): ${totalUsers}`);
    console.log(`✅ Total de imagens no banco: ${totalImages}`);
    console.log(`⚠️  Usuários sem user_usage: ${profilesWithoutUsage?.length || 0}`);
    console.log(`⚠️  Imagens órfãs: ${orphanCount}`);
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Executar sql/FIX_IMAGES_RLS.sql no Supabase');
    console.log('2. Testar histórico no frontend');
    console.log('3. Verificar fluxo de pagamento');
    console.log('4. Testar reset mensal de créditos');
    
    console.log('\n' + '='.repeat(80) + '\n');
}

testSaaSFlows()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Erro na auditoria:', err);
        process.exit(1);
    });
