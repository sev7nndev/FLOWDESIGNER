const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ NO API KEY FOUND!");
    process.exit(1);
}

async function listAllModels() {
    console.log("🔍 Querying Google API for ALL available models...");
    try {
        const response = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        const models = response.data.models;
        if (!models) {
            console.log("❌ No models found in response.");
            return;
        }

        console.log(`✅ Found ${models.length} models.`);
        
        console.log("\n--- IMAGE GENERATION MODELS ---");
        models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateImage")).forEach(m => {
             console.log(`🎨 ${m.name.replace('models/', '')} (${m.displayName})`);
        });

    } catch (e) {
        console.error("❌ API Error:", e.response ? e.response.data : e.message);
    }
}

listAllModels();
