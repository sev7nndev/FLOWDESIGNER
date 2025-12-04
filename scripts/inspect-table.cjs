const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspect() {
    console.log('🕵️ Inspecting user_usage table...');
    const { data, error } = await supabase.from('user_usage').select('*').limit(1);

    if (error) {
        console.error('❌ Error selecting:', error);
    } else if (data && data.length > 0) {
        console.log('✅ Columns found:', Object.keys(data[0]));
        console.log('Sample row:', data[0]);
    } else {
        console.log('⚠️ Table empty or not accessible with *');
    }
}

inspect();
