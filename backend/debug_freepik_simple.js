
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

async function testFreepikSimple() {
    console.log("🧪 Testing Freepik Simple (No Resolution Param)...");

    const payload = {
        prompt: "burger",
        model: "super_real",
        aspect_ratio: "traditional_3_4",
        // resolution removed
        guidance_scale: 2.5,
        filter_nsfw: true
    };

    try {
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
        console.log(`Task: ${taskId}`);

        // Poll
        for(let i=0; i<15; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const poll = await axios.get(`https://api.freepik.com/v1/ai/mystic/${taskId}`, {
                headers: { 'x-freepik-api-key': FREEPIK_API_KEY }
            });
            const status = poll.data.data.status;
            process.stdout.write(status + " ");
            if(status === 'COMPLETED' || status === 'FAILED') break;
        }
        console.log("\nDone.");

    } catch (e) {
        console.error("Error:", e.message);
        if(e.response) console.error(JSON.stringify(e.response.data));
    }
}

testFreepikSimple();
