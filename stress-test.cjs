const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '.env.local');

// Manual parser
if (fs.existsSync(envPath)) {
    console.log('📄 Found .env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
} else {
    console.error('❌ .env.local not found at:', envPath);
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; // Anon Key needed for generic client

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials (VITE_SUPABASE_ANON_KEY)');
    process.exit(1);
}

// Client not strictly needed for BYPASS mode, but useful if we wanted auth
// const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runStressTest() {
    console.log('🚀 Starting "Professionalism" Stress Test (BYPASS Mode)...');
    console.log('⚠️ Using x-bypass-auth header to verify AI Logic without DB write permissions.');

    const prompts = [
        { name: "Burger King Mockup", type: "Gourmet Hamburgueria", details: "Delicious smashed burger with cheddar cheese" },
        { name: "Tesla Service", type: "Electric Mechanic", details: "Futuristic garage, cybernetic tools" },
        { name: "Neon Party", type: "Nightclub Event", details: "Vibrant colors, DJ, confetti" }
    ];

    for (let i = 0; i < 3; i++) {
        console.log(`\n-----------------------------------`);
        console.log(`🧪 TEST CASE ${i + 1}/3: ${prompts[i].name}`);
        console.log(`-----------------------------------`);

        try {
            const start = Date.now();
            const response = await axios.post('http://localhost:3001/api/generate', {
                promptInfo: {
                    companyName: prompts[i].name,
                    details: prompts[i].details,
                    addressStreet: "Tech Avenue",
                    addressNumber: "101",
                    addressNeighborhood: "Silicon Valley",
                    addressCity: "Innovation City",
                    phone: "(11) 99999-9999"
                },
                artStyle: "Photorealistic"
            }, {
                headers: {
                    'x-bypass-auth': 'testing-secret-123',
                    'Content-Type': 'application/json'
                },
                timeout: 120000 // 120s timeout (AI is slow)
            });

            const duration = ((Date.now() - start) / 1000).toFixed(1);
            if (response.data.image) {
                console.log(`✅ SUCCESS in ${duration}s`);
                console.log(`🖼️  Image Data Size: ${response.data.image.image_url.length} chars`);
            } else {
                console.log('⚠️  Response received but no image?');
                console.log(response.data);
            }

        } catch (error) {
            console.error('❌ GENERATION FAILED:', error.response?.data || error.message);
        }

        console.log('⏳ Waiting 5s before next test...');
        await sleep(5000);
    }

    console.log(`\n🎉 Stress Test Complete.`);
}

runStressTest();
