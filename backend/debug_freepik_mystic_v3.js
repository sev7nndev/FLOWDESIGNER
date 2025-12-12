
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

async function testFreepikMystic() {
    console.log("🧪 Testing Freepik Mystic 1.5 Response Structure (v3)...");

    const payload = {
        prompt: "A professional flyer for a burger restaurant, delicious bacon burger, high quality, 8k",
        model: "super_real",
        aspect_ratio: "traditional_3_4",
        resolution: "2k",
        guidance_scale: 2.5,
        filter_nsfw: true
    };

    try {
        const response = await axios.post(
            "https://api.freepik.com/v1/ai/mystic",
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-freepik-api-key': FREEPIK_API_KEY,
                    'Accept': 'application/json'
                }
            }
        );

        console.log("✅ Success! Status:", response.status);
        
        // Write full raw response to file
        const logPath = path.join(__dirname, 'debug_freepik_mystic_response.json');
        fs.writeFileSync(logPath, JSON.stringify(response.data, null, 2));
        console.log(`💾 Saved full response to ${logPath}`);

    } catch (error) {
        console.error("❌ Failed. Status:", error.response?.status);
        console.error("Error Data:", JSON.stringify(error.response?.data, null, 2));
    }
}

testFreepikMystic();
