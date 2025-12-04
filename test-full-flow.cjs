const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testFullFlow() {
    console.log("=== Testing Full Image Generation Flow ===\n");

    // Step 1: Generate Image
    console.log("Step 1: Generating image with Imagen 4...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;
        const payload = {
            instances: [{ prompt: "A beautiful landscape" }],
            parameters: { sampleCount: 1, aspectRatio: "9:16" }
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000
        });

        const base64Image = response.data?.predictions?.[0]?.bytesBase64Encoded;

        if (!base64Image) {
            console.error("❌ No image data in response");
            console.log("Response:", JSON.stringify(response.data, null, 2));
            return;
        }

        console.log("✅ Image generated successfully");
        console.log(`   Base64 length: ${base64Image.length}`);

        // Step 2: Test data URL format
        console.log("\nStep 2: Testing data URL format...");
        const dataUrl = `data:image/png;base64,${base64Image}`;
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
            console.error("❌ Invalid data URL format");
            return;
        }

        console.log("✅ Data URL format is valid");
        console.log(`   Content-Type: ${matches[1]}`);

        // Step 3: Test Buffer creation
        console.log("\nStep 3: Testing Buffer creation...");
        const imageBuffer = Buffer.from(matches[2], 'base64');
        console.log("✅ Buffer created successfully");
        console.log(`   Buffer size: ${imageBuffer.length} bytes`);

        console.log("\n=== All steps passed! ===");

    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
        if (error.response?.data) {
            console.log("Full error:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

(async () => {
    if (!GEMINI_API_KEY) {
        console.error("No API Key found in .env.local");
        return;
    }
    await testFullFlow();
})();
