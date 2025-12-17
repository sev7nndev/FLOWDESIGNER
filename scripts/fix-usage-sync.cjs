/**
 * CORREÇÃO AUTOMÁTICA: SINCRONIZAR CONTADOR DE USO COM HISTÓRICO
 * 
 * Este script corrige automaticamente discrepâncias entre:
 * - user_usage.images_generated (contador)
 * - COUNT(*) FROM images WHERE user_id = X (histórico real)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ ERRO: Variáveis de ambiente não configuradas');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixUsageSync() {
    console.log('\n' + '═'.repeat(80));
    console.log('🔧 CORREÇÃO: SINCRONIZAR CONTADOR DE USO COM HISTÓRICO');
    console.log('═'.repeat(80) + '\n');

    try {
        // 1. Buscar todos os usuários
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, email, role')
            .not('role', 'in', '(owner,dev,admin)');

        if (usersError) throw usersError;

        console.log(`📊 Processando ${users.length} usuários...\n`);

        let fixed = 0;
        let created = 0;
        let skipped = 0;

        for (const user of users) {
            // Contar imagens reais
            const { data: images, error: imagesError } = await supabase
                .from('images')
                .select('id')
                .eq('user_id', user.id);

            if (imagesError) {
                console.error(`❌ Erro ao contar imagens de ${user.email}:`, imagesError.message);
                continue;
            }

            const actualCount = images?.length || 0;

            // Buscar registro de uso
            const { data: usage, error: usageError } = await supabase
                .from('user_usage')
                .select('images_generated')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!usage) {
                // Criar registro se não existir
                const { error: insertError } = await supabase
                    .from('user_usage')
                    .insert({
                        user_id: user.id,
                        images_generated: actualCount,
                        plan_id: user.role,
                        cycle_start_date: new Date().toISOString()
                    });

                if (insertError) {
                    console.error(`❌ Erro ao criar uso para ${user.email}:`, insertError.message);
                } else {
                    console.log(`✅ CRIADO: ${user.email} → ${actualCount} imagens`);
                    created++;
                }
            } else if (usage.images_generated !== actualCount) {
                // Atualizar se diferente
                const { error: updateError } = await supabase
                    .from('user_usage')
                    .update({ images_generated: actualCount })
                    .eq('user_id', user.id);

                if (updateError) {
                    console.error(`❌ Erro ao atualizar ${user.email}:`, updateError.message);
                } else {
                    console.log(`🔧 CORRIGIDO: ${user.email} → ${usage.images_generated} para ${actualCount}`);
                    fixed++;
                }
            } else {
                skipped++;
            }
        }

        // Resumo
        console.log('\n' + '═'.repeat(80));
        console.log('📊 RESUMO DA CORREÇÃO');
        console.log('═'.repeat(80));
        console.log(`✅ Registros criados: ${created}`);
        console.log(`🔧 Registros corrigidos: ${fixed}`);
        console.log(`⏭️  Registros já corretos: ${skipped}`);
        console.log(`📊 Total processado: ${users.length}`);
        console.log('═'.repeat(80) + '\n');

        if (created + fixed > 0) {
            console.log('✅ Sincronização concluída! Execute a auditoria novamente para confirmar:');
            console.log('   node scripts/audit-usage-sync.cjs\n');
        } else {
            console.log('✅ Todos os registros já estavam sincronizados!\n');
        }

    } catch (error) {
        console.error('\n❌ ERRO NA CORREÇÃO:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Executar correção
fixUsageSync()
    .then(() => {
        console.log('✅ Correção concluída!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
