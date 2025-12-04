const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://akynbiixxcftxgvjpxhu.supabase.co"; // From .env I saw (ref in key) or process env
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDB() {
    console.log("Testing DB Tables...");

    // Check Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    console.log("Profiles Table:", pError ? `ERROR: ${pError.message}` : "EXISTS");
    if (profiles) console.log("Sample Profile:", profiles[0]);

    // Check User Usage
    const { data: usage, error: uError } = await supabase.from('user_usage').select('*').limit(1);
    console.log("User Usage Table:", uError ? `ERROR: ${uError.message}` : "EXISTS");

    // Check Plan Settings
    const { data: plans, error: plError } = await supabase.from('plan_settings').select('*').limit(1);
    console.log("Plan Settings Table:", plError ? `ERROR: ${plError.message}` : "EXISTS");

    // Check App Config
    const { data: config, error: cError } = await supabase.from('app_config').select('*').limit(1);
    console.log("App Config Table:", cError ? `ERROR: ${cError.message}` : "EXISTS");
}

testDB();
