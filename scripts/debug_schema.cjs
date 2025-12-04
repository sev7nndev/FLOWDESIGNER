const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Fetching one profile...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) console.error(error);
    else console.log('Profile keys:', Object.keys(data[0] || {}));
}

run();
