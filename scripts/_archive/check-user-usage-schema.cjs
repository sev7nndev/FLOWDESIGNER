const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    console.log('🔍 Checking user_usage columns...');

    // We can't query information_schema easily via JS client usually, but we can Try an insert and see error, OR Select * limit 0
    const { data, error } = await supabase.from('user_usage').select('*').limit(1);

    if (error) {
        console.error('Error selecting:', error.message);
        return;
    }

    if (data.length === 0) {
        console.log('Table empty, checking mock insert failure...');
        // Or better: just print keys if we had data.
        // Let's assume keys from data[0] if exists.
        // If empty, I'll rely on the fact that I queried '*' and Supabase client might not return structure if empty.
        console.log('⚠️ Table empty, cannot infer columns from empty result easily.');
    } else {
        console.log('✅ Columns found:', Object.keys(data[0]));
    }
}

checkColumns();
