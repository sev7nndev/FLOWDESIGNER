const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Supabase credentials missing.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkImages() {
    console.log("=== Checking Images in Database ===\n");

    // Check all images
    const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error querying images:", error);
        return;
    }

    console.log(`✅ Found ${data.length} image(s) in database\n`);

    data.forEach((img, index) => {
        console.log(`Image ${index + 1}:`);
        console.log(`  ID: ${img.id}`);
        console.log(`  User ID: ${img.user_id}`);
        console.log(`  Image URL: ${img.image_url}`);
        console.log(`  Created: ${img.created_at}`);
        console.log(`  Prompt: ${img.prompt?.substring(0, 100)}...`);
        console.log('');
    });

    // Test public URL generation
    if (data.length > 0) {
        console.log("Testing public URL generation for first image...");
        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(data[0].image_url);

        console.log(`Public URL: ${urlData.publicUrl}`);
    }
}

checkImages();
