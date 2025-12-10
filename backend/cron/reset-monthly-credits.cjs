const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const resetMonthlyCredits = async () => {
    console.log('🔄 [CRON] Verificando créditos para renovação...');

    try {
        // Primeiro, verificar se a tabela existe e tem as colunas corretas
        const { data: testData, error: testError } = await supabase
            .from('user_usage')
            .select('user_id, cycle_start_date')
            .limit(1);

        if (testError) {
            console.error('❌ Tabela user_usage não está acessível:', testError.message);
            console.log('💡 Execute o SQL fix_user_usage_table.sql no Supabase para corrigir');
            return;
        }

        // Buscar usuários com ciclo expirado (>30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: expiredUsers, error } = await supabase
            .from('user_usage')
            .select('user_id, cycle_start_date')
            .lt('cycle_start_date', thirtyDaysAgo.toISOString());

        if (error) {
            console.error('❌ Erro ao buscar usuários:', error);
            return;
        }

        if (!expiredUsers || expiredUsers.length === 0) {
            console.log('✅ Nenhum usuário com ciclo expirado');
            return;
        }

        console.log(`📊 Encontrados ${expiredUsers.length} usuários com ciclo expirado`);

        // Resetar créditos para cada usuário
        for (const user of expiredUsers) {
            // Buscar o perfil do usuário para saber o plano
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.user_id)
                .single();

            const role = profile?.role || 'free';

            // Não resetar para dev/owner/admin (eles têm ilimitado)
            if (role === 'dev' || role === 'owner' || role === 'admin') {
                console.log(`⏭️ Pulando usuário ${user.user_id} (role: ${role})`);
                continue;
            }

            const { error: updateError } = await supabase
                .from('user_usage')
                .update({
                    cycle_start_date: new Date().toISOString()
                })
                .eq('user_id', user.user_id);

            if (updateError) {
                console.error(`❌ Erro ao resetar ciclo para ${user.user_id}:`, updateError);
            } else {
                console.log(`✅ Ciclo resetado para usuário ${user.user_id} (${role})`);
            }
        }

        console.log('✅ [CRON] Renovação de créditos concluída');
    } catch (e) {
        console.error('❌ [CRON] Erro na renovação de créditos:', e);
    }
};

// Rodar a cada 24 horas (86400000 ms)
const startCron = () => {
    console.log('🚀 [CRON] Iniciando job de renovação de créditos (a cada 24h)');

    // Rodar imediatamente ao iniciar
    resetMonthlyCredits();

    // Rodar a cada 24h
    setInterval(resetMonthlyCredits, 24 * 60 * 60 * 1000);
};

module.exports = { startCron, resetMonthlyCredits };
