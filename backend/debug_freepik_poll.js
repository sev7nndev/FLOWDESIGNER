
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testFreepikPoll() {
    console.log("🧪 Testing Freepik Mystic Async Polling...");

    try {
        // 1. Initiate Generation
        console.log("🚀 Step 1: Initiating Task...");
        const initResponse = await axios.post(
            "https://api.freepik.com/v1/ai/mystic",
            {
                prompt: "A delicious burger, cinematic lighting, 8k",
                model: "super_real", 
                aspect_ratio: "traditional_3_4",
                resolution: "2k",
                filter_nsfw: true
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-freepik-api-key': FREEPIK_API_KEY,
                    'Accept': 'application/json'
                }
            }
        );

        const taskId = initResponse.data.data.task_id;
        console.log(`✅ Task Initiated. ID: ${taskId}`);

        // 2. Poll for Status
        let attempts = 0;
        const maxAttempts = 30;
        let finalData = null;

        while (attempts < maxAttempts) {
            attempts++;
            console.log(`⏳ Polling attempt ${attempts}...`);
            await sleep(2000); // Wait 2s

            const pollResponse = await axios.get(
                `https://api.freepik.com/v1/ai/mystic/${taskId}`,
                {
                    headers: {
                        'x-freepik-api-key': FREEPIK_API_KEY,
                        'Accept': 'application/json'
                    }
                }
            );

            const status = pollResponse.data.data.status;
            console.log(`   Status: ${status}`);

            if (status === 'COMPLETED') {
                finalData = pollResponse.data;
                console.log("✅ Task Completed!");
                break;
            } else if (status === 'FAILED') {
                console.error("❌ Task Failed during polling.");
                finalData = pollResponse.data;
                break;
            }
        }

        if (finalData) {
            const logPath = path.join(__dirname, 'debug_freepik_poll_result.json');
            fs.writeFileSync(logPath, JSON.stringify(finalData, null, 2));
            console.log(`💾 Final Result saved to ${logPath}`);
        } else {
            console.error("❌ Timed out waiting for task completion.");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.response) {
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testFreepikPoll();
