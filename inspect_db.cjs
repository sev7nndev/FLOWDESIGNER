const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log('🔍 Debugging user_usage insert...');
    const dummyId = '11111111-1111-1111-1111-111111111111';

    // Cleanup first
    await supabase.from('user_usage').delete().eq('user_id', dummyId);

    // Try insert with ONLY images_generated (Simulating Trigger V2)
    const { error } = await supabase.from('user_usage').insert({
        user_id: dummyId,
        images_generated: 0,
        plan_id: 'free'
    });

    if (error) {
        console.error('❌ Insert Failed:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    } else {
        console.log('✅ Insert Success! Column constraints are OK.');
        // Cleanup
        await supabase.from('user_usage').delete().eq('user_id', dummyId);
    }
}
inspect();
