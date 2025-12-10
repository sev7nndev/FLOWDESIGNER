const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectPlans() {
    console.log('🔍 Inspecionando tabelas de planos...');

    const { data: settings, error: err1 } = await supabase.from('plan_settings').select('*');
    if (err1) console.error('❌ Erro em plan_settings:', err1.message);
    else console.log(`✅ plan_settings: ${settings?.length || 0} registros encontrados.`);

    if (settings && settings.length > 0) console.table(settings);
    else console.warn('⚠️ Tabela plan_settings está VAZIA!');

    const { data: details, error: err2 } = await supabase.from('plan_details').select('*');
    if (err2) console.error('❌ Erro em plan_details:', err2.message);
    else console.log(`✅ plan_details: ${details?.length || 0} registros encontrados.`);

    if (details && details.length > 0) console.table(details);
    else console.warn('⚠️ Tabela plan_details está VAZIA!');
}

inspectPlans();
