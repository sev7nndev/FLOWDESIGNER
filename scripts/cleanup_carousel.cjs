const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanOldImages() {
    console.log('🧹 Cleaning old images...');

    // Delete images created before Dec 1st, 2025
    const cutoffDate = '2025-12-01T00:00:00.000Z';

    // Select first to confirm
    const { data: toDelete, error: fetchError } = await supabase
        .from('landing_carousel_images')
        .select('*')
        .lt('created_at', cutoffDate);

    if (fetchError) {
        console.error('❌ Fetch Error:', fetchError.message);
        return;
    }

    console.log(`Found ${toDelete.length} old images to delete.`);

    if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from('landing_carousel_images')
            .delete()
            .lt('created_at', cutoffDate);

        if (deleteError) {
            console.error('❌ Delete Error:', deleteError.message);
        } else {
            console.log('✅ Successfully deleted old images.');

            // Note: We should technically delete from Storage too, but for now we just clear the DB table reference
            // to solve the UI issue immediately.
        }
    } else {
        console.log('✨ No old images found.');
    }
}

cleanOldImages();
