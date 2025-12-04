const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Supabase credentials missing.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createBucket() {
    console.log("Attempting to create 'images' bucket...");
    const { data, error } = await supabase
        .storage
        .createBucket('images', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
        });

    if (error) {
        console.error("Error creating bucket:", error);
        // Check if it already exists but maybe private?
        const { data: buckets } = await supabase.storage.listBuckets();
        console.log("Existing buckets:", buckets.map(b => b.name));
    } else {
        console.log("Bucket 'images' created successfully:", data);
    }
}

createBucket();
