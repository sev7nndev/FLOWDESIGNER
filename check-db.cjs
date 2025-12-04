const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Supabase credentials missing.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkDatabase() {
    console.log("=== Checking Database Setup ===\n");

    // Check if images table exists by trying to query it
    console.log("1. Checking 'images' table...");
    const { data, error } = await supabase
        .from('images')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ Error accessing 'images' table:", error.message);
        console.log("   Code:", error.code);
        console.log("   Details:", error.details);
        console.log("   Hint:", error.hint);
    } else {
        console.log("✅ 'images' table exists and is accessible");
        console.log(`   Found ${data.length} record(s)`);
    }

    // Check storage bucket
    console.log("\n2. Checking 'images' storage bucket...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.error("❌ Error listing buckets:", bucketError);
    } else {
        const imagesBucket = buckets.find(b => b.name === 'images');
        if (imagesBucket) {
            console.log("✅ 'images' bucket exists");
            console.log("   Public:", imagesBucket.public);
        } else {
            console.log("❌ 'images' bucket not found");
            console.log("   Available buckets:", buckets.map(b => b.name));
        }
    }
}

checkDatabase();
