
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

async function testFreepikRepro() {
    console.log("🧪 Testing Freepik Mystic Failure Reproduction...");

    const userPrompt = "A professional flyer for a burger restaurant, delicious bacon burger, high quality, 8k";
    
    // EXACT PRODUCTION PROMPT STRUCTURE
    const flyerPrompt = `
PROFESSIONAL COMMERCIAL FLYER DESIGN.
HIGH QUALITY GRAPHIC DESIGN, 8K, ULTRA SHARP.

ALL VISIBLE TEXT MUST BE IN BRAZILIAN PORTUGUESE ONLY.
DO NOT USE SPANISH. DO NOT MIX LANGUAGES. DO NOT INVENT WORDS.

CLEAN TYPOGRAPHY, MODERN STYLE, NO RANDOM TEXT.

${userPrompt}
`;

    const payload = {
        prompt: flyerPrompt,
        model: "super_real",
        aspect_ratio: "traditional_3_4",
        resolution: "2k", // SUSPECT
        guidance_scale: 2.5,
        filter_nsfw: true
    };

    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
        // 1. Initiate
        const initResponse = await axios.post(
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

        const taskId = initResponse.data?.data?.task_id;
        console.log(`Task ID: ${taskId}`);

        // 2. Poll
        let attempts = 0;
        while (attempts < 20) {
            attempts++;
            await new Promise(r => setTimeout(r, 2000));
            
            const pollResponse = await axios.get(
                `https://api.freepik.com/v1/ai/mystic/${taskId}`,
                { headers: { 'x-freepik-api-key': FREEPIK_API_KEY } }
            );

            const status = pollResponse.data?.data?.status;
            process.stdout.write(`[${status}] `);

            if (status === 'COMPLETED') {
                console.log("\n✅ SUCCESS!");
                break;
            } else if (status === 'FAILED') {
                console.log("\n❌ FAILED!");
                console.log(JSON.stringify(pollResponse.data, null, 2));
                break;
            }
        }

    } catch (error) {
        console.error("\n❌ Request Failed:", error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

testFreepikRepro();
