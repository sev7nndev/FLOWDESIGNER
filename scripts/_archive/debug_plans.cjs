const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkPlans() {
    console.log('🔍 Checking Plan Settings...');
    const { data, error } = await supabase.from('plan_settings').select('*');

    if (error) {
        console.error('❌ Error fetching plans:', error.message);
    } else {
        console.log(`✅ Found ${data.length} plans.`);
        data.forEach(plan => console.log(`- [${plan.id}] ${plan.display_name} (${plan.price})`));
    }
}

checkPlans();
