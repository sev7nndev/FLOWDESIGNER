const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config({ path: '.env.local' });
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function findWorkingModel() {
    console.log('🔍 Searching for working text model...');

    try {
        // 1. Get list of models via REST to be sure
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await axios.get(url);
        const models = response.data.models;

        // 2. Filter for generateContent
        const textModels = models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
        console.log(`Found ${textModels.length} potential text models.`);

        // 3. Test each until one works
        const genAI = new GoogleGenerativeAI(API_KEY);

        for (const m of textModels) {
            const modelName = m.name.replace('models/', '');
            process.stdout.write(`Testing ${modelName}... `);

            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log('✅ WORKS!');
                console.log(`\n🎉 RECOMMENDED MODEL: ${modelName}`);
                return; // Stop after finding the first working one
            } catch (err) {
                console.log('❌ Failed');
            }
        }

        console.log('❌ No working text model found.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

findWorkingModel();
