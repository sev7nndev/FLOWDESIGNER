const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfiles() {
    console.log('🔍 Checking profiles columns...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error('Error selecting profiles:', error.message);
        return;
    }

    if (data.length === 0) {
        console.log('⚠️ Profiles table empty, trying to infer from error or assume default.');
    } else {
        console.log('✅ Profiles Columns:', Object.keys(data[0]));
    }
}

checkProfiles();
