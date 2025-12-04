const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testManualInsert() {
    const fakeId = uuidv4();
    console.log(`🧪 Testing manual insert for ID: ${fakeId}`);

    // 1. Insert Profile
    console.log('1. Inserting Profile...');
    const { error: profileError } = await supabase.from('profiles').insert({
        id: fakeId,
        first_name: 'Test',
        last_name: 'Manual',
        role: 'free'
    });

    if (profileError) {
        console.error('❌ Profile Insert Failed:', profileError.message);
        // If FK fails (auth.users), we can't insert into profiles because of FK constraint usually!
        // Constraint: `id UUID REFERENCES auth.users(id)`
        // Ah! We cannot insert into profiles if user doesn't exist in auth.users.
        // So this test is flawed unless we insert into auth.users first?
        // But we can't insert into auth.users via client easily strictly.
        console.log('   (Expected failure if FK auth.users exists and user is missing)');
        return;
    } else {
        console.log('✅ Profile Inserted (Unexpected if FK exists)');
    }
}

// Better approach:
// We verify constraints.
// But wait, the trigger runs AFTER insert into auth.users. So the user Exists.
// Check if the Previous "Fix" actually updated the function?
// Maybe the user ran it but it failed? (Syntax error in copy/paste?)
// I will notify the user with a simplified, very safe trigger removal script to see if removing the trigger allows signup. 
// If removing trigger fixes signup, then the trigger body is definitely the issue.

testManualInsert();
