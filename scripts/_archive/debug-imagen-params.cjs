const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ API Key not found in .env.local");
    process.exit(1);
}

const models = [
    "imagen-4.0-generate-001",
    "imagen-3.0-generate-002"
];

async function testModel(model) {
    console.log(`\n🧪 Testing Model: ${model}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${API_KEY}`;

    const payload = {
        instances: [{ prompt: "A futuristic city flyer design" }],
        parameters: {
            sampleCount: 1,
            aspectRatio: "3:4"
        }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.predictions) {
            console.log(`✅ Success for ${model}`);
        } else {
            console.log(`⚠️ Response OK but no predictions for ${model}`);
            console.log(JSON.stringify(response.data, null, 2));
        }
    } catch (error) {
        console.error(`❌ Failed for ${model}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
}

async function run() {
    for (const m of models) {
        await testModel(m);
    }
}

run();
