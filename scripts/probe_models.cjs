const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ NO API KEY");
    process.exit(1);
}

async function listModelsDirectly() {
    console.log("🔍 Fetching model list from Google...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const res = await axios.get(url);
        
        console.log("✅ Models Found:");
        const models = res.data.models;
        
        const imageModels = models.filter(m => m.name.includes('imagen') || m.supportedGenerationMethods?.includes('predict'));
        
        if (imageModels.length === 0) {
            console.log("⚠️ No explicit 'Imagen' models found in list. Listing ALL models:");
            models.forEach(m => console.log(`- ${m.name}`));
        } else {
            imageModels.forEach(m => console.log(`🎨 ${m.name} (${m.version})`));
        }

    } catch (error) {
        console.error("❌ Failed to list models:", error.message);
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        }
    }
}

listModelsDirectly();
