/**
 * AUDITORIA: VERIFICAR SINCRONIZAÇÃO ENTRE CONTADOR DE USO E HISTÓRICO
 * 
 * IMPORTANTE: O contador representa "imagens GERADAS", não "imagens SALVAS"
 * 
 * Comportamento esperado:
 * - Contador >= Imagens salvas (pode ser maior se usuário deletou imagens)
 * - Contador NUNCA diminui ao deletar imagens (previne exploit de quota)
 * - Contador só reseta no início do ciclo mensal
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

async function auditUsageSync() {
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 AUDITORIA: SINCRONIZAÇÃO CONTADOR DE USO vs HISTÓRICO');
    console.log('═'.repeat(80) + '\n');

    try {
        // 1. Buscar todos os usuários (exceto roles especiais)
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name, role')
            .not('role', 'in', '(owner,dev,admin)');

        if (usersError) throw usersError;

        console.log(`📊 Total de usuários a auditar: ${users.length}\n`);

        const discrepancies = [];
        const summary = {
            totalUsers: users.length,
            perfectSync: 0,
            minorDiscrepancy: 0,
            majorDiscrepancy: 0,
            missingUsage: 0,
            totalCounterValue: 0,
            totalActualImages: 0
        };

        // 2. Para cada usuário, comparar contador vs imagens salvas
        for (const user of users) {
            // Buscar contador de uso
            const { data: usage, error: usageError } = await supabase
                .from('user_usage')
                .select('images_generated')
                .eq('user_id', user.id)
                .maybeSingle();

            // Buscar imagens salvas
            const { data: images, error: imagesError } = await supabase
                .from('images')
                .select('id, created_at')
                .eq('user_id', user.id);

            if (imagesError) {
                console.error(`❌ Erro ao buscar imagens de ${user.email}:`, imagesError.message);
                continue;
            }

            const counterValue = usage?.images_generated || 0;
            const actualImages = images?.length || 0;
            const difference = counterValue - actualImages;

            summary.totalCounterValue += counterValue;
            summary.totalActualImages += actualImages;

            // Classificar discrepância
            if (!usage) {
                summary.missingUsage++;
                discrepancies.push({
                    user,
                    counterValue: 0,
                    actualImages,
                    difference: -actualImages,
                    severity: 'MISSING_USAGE',
                    message: 'Usuário sem registro em user_usage'
                });
            } else if (difference === 0) {
                summary.perfectSync++;
                console.log(`✅ ${user.email}: PERFEITO (${counterValue} = ${actualImages})`);
            } else if (Math.abs(difference) <= 2) {
                summary.minorDiscrepancy++;
                console.log(`⚠️  ${user.email}: PEQUENA DIFERENÇA (contador: ${counterValue}, imagens: ${actualImages}, diff: ${difference})`);
                discrepancies.push({
                    user,
                    counterValue,
                    actualImages,
                    difference,
                    severity: 'MINOR',
                    message: 'Diferença aceitável (≤2)'
                });
            } else {
                summary.majorDiscrepancy++;
                console.log(`🚨 ${user.email}: GRANDE DIFERENÇA (contador: ${counterValue}, imagens: ${actualImages}, diff: ${difference})`);
                discrepancies.push({
                    user,
                    counterValue,
                    actualImages,
                    difference,
                    severity: 'MAJOR',
                    message: 'Diferença significativa (>2)'
                });
            }
        }

        // 3. Relatório Final
        console.log('\n' + '═'.repeat(80));
        console.log('📊 RESUMO DA AUDITORIA');
        console.log('═'.repeat(80));
        console.log(`Total de usuários: ${summary.totalUsers}`);
        console.log(`✅ Sincronizados perfeitamente: ${summary.perfectSync} (${((summary.perfectSync/summary.totalUsers)*100).toFixed(1)}%)`);
        console.log(`⚠️  Pequenas discrepâncias: ${summary.minorDiscrepancy} (${((summary.minorDiscrepancy/summary.totalUsers)*100).toFixed(1)}%)`);
        console.log(`🚨 Grandes discrepâncias: ${summary.majorDiscrepancy} (${((summary.majorDiscrepancy/summary.totalUsers)*100).toFixed(1)}%)`);
        console.log(`❌ Sem registro de uso: ${summary.missingUsage} (${((summary.missingUsage/summary.totalUsers)*100).toFixed(1)}%)`);
        console.log(`\n📈 Total no contador: ${summary.totalCounterValue}`);
        console.log(`📸 Total de imagens: ${summary.totalActualImages}`);
        console.log(`📊 Diferença global: ${summary.totalCounterValue - summary.totalActualImages}`);

        // 4. Detalhes das Discrepâncias
        if (discrepancies.length > 0) {
            console.log('\n' + '═'.repeat(80));
            console.log('🔍 DETALHES DAS DISCREPÂNCIAS');
            console.log('═'.repeat(80) + '\n');

            discrepancies.forEach((disc, index) => {
                console.log(`${index + 1}. ${disc.user.email} (${disc.user.role})`);
                console.log(`   Contador: ${disc.counterValue} | Imagens: ${disc.actualImages} | Diferença: ${disc.difference}`);
                console.log(`   Severidade: ${disc.severity} - ${disc.message}\n`);
            });
        }

        // 5. Recomendações
        console.log('\n' + '═'.repeat(80));
        console.log('💡 RECOMENDAÇÕES');
        console.log('═'.repeat(80));

        if (summary.perfectSync === summary.totalUsers) {
            console.log('✅ EXCELENTE! Todos os contadores estão sincronizados perfeitamente.');
        } else {
            console.log('\n⚠️  AÇÕES RECOMENDADAS:\n');
            
            if (summary.missingUsage > 0) {
                console.log(`1. Criar registros em user_usage para ${summary.missingUsage} usuários sem registro`);
            }
            
            if (summary.majorDiscrepancy > 0) {
                console.log(`2. Investigar ${summary.majorDiscrepancy} usuários com grandes discrepâncias`);
                console.log('   Possíveis causas:');
                console.log('   - Imagens deletadas mas contador não decrementado');
                console.log('   - Gerações que falharam mas incrementaram contador');
                console.log('   - Problemas no código de incremento');
            }

            if (summary.minorDiscrepancy > 0) {
                console.log(`3. Monitorar ${summary.minorDiscrepancy} usuários com pequenas diferenças`);
            }

            console.log('\n📝 SCRIPT DE CORREÇÃO:');
            console.log('   Para corrigir automaticamente, execute:');
            console.log('   node scripts/fix-usage-sync.cjs');
        }

        console.log('\n' + '═'.repeat(80) + '\n');

        // 6. Salvar relatório em arquivo
        const report = {
            timestamp: new Date().toISOString(),
            summary,
            discrepancies: discrepancies.map(d => ({
                email: d.user.email,
                role: d.user.role,
                counterValue: d.counterValue,
                actualImages: d.actualImages,
                difference: d.difference,
                severity: d.severity
            }))
        };

        const fs = require('fs');
        const reportPath = require('path').resolve(__dirname, '../audit-usage-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Relatório completo salvo em: ${reportPath}\n`);

        return summary;

    } catch (error) {
        console.error('\n❌ ERRO NA AUDITORIA:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Executar auditoria
auditUsageSync()
    .then(() => {
        console.log('✅ Auditoria concluída com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
