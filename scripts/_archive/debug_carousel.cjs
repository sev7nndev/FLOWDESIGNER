const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkLandingImages() {
    console.log('🔍 Checking Landing Carousel Images...');
    // Order by created_at DESC so newest are first
    const { data, error } = await supabase.from('landing_carousel_images').select('*').order('created_at', { ascending: false });
    
    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Found ${data.length} images.`);
        
        // Take the top 5 newest images to ensure we only get the fresh user uploads
        // Assuming the user just uploaded them, they will be at the top.
        const recentImages = data.slice(0, 8); 

        const lines = recentImages.map(img => {
            // Construct Public URL
            // Format: https://[PROJECT].supabase.co/storage/v1/object/public/landing-carousel/[FILENAME]
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/landing-carousel/${img.image_url}`;
            return publicUrl;
        });

        fs.writeFileSync('temp_urls.txt', lines.join('\n'));
        console.log('✅ URLs written to temp_urls.txt');
    }
}

checkLandingImages();
