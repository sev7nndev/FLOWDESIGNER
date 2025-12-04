const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testImageGen() {
    console.log("\nTesting Image Generation (Imagen 4)...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;
        const payload = {
            instances: [{ prompt: "A beautiful landscape" }],
            parameters: { sampleCount: 1, aspectRatio: "1:1" }
        };
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log("Image Gen Success:", response.status);
        if (response.data.predictions && response.data.predictions[0].bytesBase64Encoded) {
            console.log("Image Data Received (Base64 length):", response.data.predictions[0].bytesBase64Encoded.length);
        } else {
            console.log("Unexpected Response Structure:", JSON.stringify(response.data, null, 2));
        }
    } catch (e) {
        console.error("Image Gen Failed:", JSON.stringify(e.response?.data || e.message, null, 2));
    }
}

(async () => {
    if (!GEMINI_API_KEY) {
        console.error("No API Key found in .env.local");
        return;
    }
    await testImageGen();
})();
