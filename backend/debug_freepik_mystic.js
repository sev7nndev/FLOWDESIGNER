
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

async function testFreepikMystic() {
    console.log("🧪 Testing Freepik Mystic 1.5 Payload...");
    console.log("API Key:", FREEPIK_API_KEY ? "Present" : "Missing");

    const payload = {
        prompt: "A professional flyer for a burger restaurant, delicious bacon burger, high quality, 8k",
        resolution: "2k",
        aspect_ratio: "traditional_3_4", // Valid value from error log
        model: "super_real", // Valid value from error log
        filter_nsfw: true
        // styling: removed for now to isolate validity
    };

    try {
        const response = await axios.post(
            "https://api.freepik.com/v1/ai/mystic", // Correct endpoint?
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
        console.log("Response Data Keys:", Object.keys(response.data));
        if (response.data.data && response.data.data.length > 0) {
             console.log("Image URL/Base64 present.");
        }

    } catch (error) {
        console.error("❌ Failed. Status:", error.response?.status);
        const errorData = JSON.stringify(error.response?.data, null, 2);
        console.error("Error Data:", errorData);
        // Save to file to see full list of valid models
        const fs = require('fs');
        fs.writeFileSync(path.join(__dirname, 'debug_freepik_error.json'), errorData);
    }
}

testFreepikMystic();
