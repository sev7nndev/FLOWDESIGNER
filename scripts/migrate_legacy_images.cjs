const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load Env
const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase Credentials. Check .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrateImages() {
    console.log('🚀 Starting Legacy Image Migration...');

    // 1. Fetch images with Base64 content
    // fetching in chunks to avoid memory issues
    const { count } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .ilike('image_url', 'data:%');

    console.log(`📊 Found approx ${count} legacy images to migrate.`);

    let processed = 0;
    let errors = 0;

    // Fetch batch
    const { data: images, error } = await supabase
        .from('images')
        .select('id, user_id, image_url')
        .ilike('image_url', 'data:%')
        .limit(100);

    if (error) {
        console.error('Error fetching images:', error);
        return;
    }

    for (const img of images) {
        try {
            const base64Data = img.image_url.split(',')[1];
            if (!base64Data) {
                console.log(`⚠️ Skiping invalid image ${img.id}`);
                continue;
            }

            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `${img.user_id}/${img.id}_migrated.png`;

            // Upload to Storage
            const { error: uploadError } = await supabase
                .storage
                .from('generated-images')
                .upload(fileName, buffer, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) {
                console.error(`❌ Upload failed for ${img.id}:`, uploadError.message);
                errors++;
                continue;
            }

            // Update DB with Path
            const { error: updateError } = await supabase
                .from('images')
                .update({ image_url: fileName })
                .eq('id', img.id);

            if (updateError) {
                console.error(`❌ DB Update failed for ${img.id}:`, updateError.message);
                errors++;
            } else {
                console.log(`✅ Migrated ${img.id}`);
                processed++;
            }

        } catch (e) {
            console.error(`❌ Critical error processing ${img.id}:`, e.message);
            errors++;
        }
    }

    console.log('Done!');
    console.log(`✅ Success: ${processed}`);
    console.log(`❌ Errors: ${errors}`);
    if (processed > 0) {
        console.log('🔄 Run this script again if there are more images remaining!');
    }
}

migrateImages();
