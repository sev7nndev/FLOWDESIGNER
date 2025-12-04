const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPlans() {
    console.log('🔍 Checking plan_settings...');
    const { data, error } = await supabase.from('plan_settings').select('*');
    if (error) console.error(error);
    else console.log('✅ Plans found:', data.length, data.map(p => p.id));
}

checkPlans();
