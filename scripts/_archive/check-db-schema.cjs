const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('🔍 Checking Schema...');

    // Check saas_settings
    const { data: settings, error: settingsError } = await supabase.from('saas_settings').select('*').limit(1);

    if (settingsError) {
        console.error('❌ saas_settings table check failed:', settingsError.message);
        if (settingsError.code === '42P01') {
            console.log('   -> Table does not exist.');
        }
    } else {
        console.log('✅ saas_settings table exists.');
        console.log('   Sample row:', settings[0] || 'Table empty');
    }

    // Check payments
    const { data: payments, error: paymentsError } = await supabase.from('payments').select('*').limit(1);
    if (paymentsError) {
        console.error('❌ payments table check failed:', paymentsError.message);
    } else {
        console.log('✅ payments table exists.');
        console.log('   Sample row:', payments[0] || 'Table empty');
    }
}

checkSchema();
