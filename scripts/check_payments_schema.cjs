const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase Service Credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
    console.log('🔍 Checking `payments` table columns...');

    // Check Select
    const { data, error } = await supabase.from('payments').select('*').limit(1);

    if (error) {
        console.error('❌ Error selecting from payments:', error.message);
    } else {
        console.log('✅ Payments table SELECT works.');
    }

    // Check Insert with paid_at
    console.log('🔍 Testing INSERT with `paid_at` column...');
    // Use a random UUID for user_id to trigger FK error (which confirms table structure is parsed)
    const { error: insertErr } = await supabase.from('payments').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        amount: 1.00,
        status: 'test',
        paid_at: new Date().toISOString()
    });

    if (insertErr) {
        console.log('ℹ️ Insert Result:', insertErr.message);
        if (insertErr.message.includes('schema cache') || insertErr.message.includes('Could not find')) {
            console.error('❌ CACHE ISSUE DETECTED or COLUMN MISSING');
        } else if (insertErr.message.includes('foreign key')) {
            console.log('✅ Column exists (FK check passed)');
        } else {
            console.log('❓ Other result:', insertErr.message);
        }
    } else {
        console.log('✅ INSERT success (Mock data)');
    }
}

checkSchema();
