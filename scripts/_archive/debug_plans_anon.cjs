const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// CRITICAL: Use ANON KEY to replicate frontend behavior
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Using Anon Key:', SUPABASE_ANON_KEY ? 'Yes' : 'No');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkPlansAnon() {
    console.log('🔍 Checking Plan Settings (ANON)...');
    const { data, error } = await supabase.from('plan_settings').select('*');

    if (error) {
        console.error('❌ Error fetching plans:', error.message);
    } else {
        console.log(`✅ Found ${data.length} plans.`);
    }

    console.log('🔍 Checking Plan Details (ANON)...');
    const { data: details, error: err2 } = await supabase.from('plan_details').select('*');
    if (err2) {
        console.error('❌ Error fetching details:', err2.message);
    } else {
        console.log(`✅ Found ${details.length} details.`);
    }
}

checkPlansAnon();
