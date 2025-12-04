const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config({ path: '.env.local' });
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('🔑 Testing API Key:', API_KEY ? 'Present' : 'Missing');

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro"
];

async function test() {
    const genAI = new GoogleGenerativeAI(API_KEY);

    console.log('\n🧠 Testing Text Models:');
    for (const modelName of modelsToTest) {
        try {
            process.stdout.write(`Testing ${modelName}... `);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log('✅ OK');
        } catch (error) {
            console.log('❌ FAILED');
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
            } else {
                console.log(`   Error: ${error.message}`);
            }
        }
    }

    console.log('\n🎨 Testing Imagen (REST):');
    const imagenModel = 'imagen-3.0-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${imagenModel}:predict?key=${API_KEY}`;

    try {
        const response = await axios.post(url, {
            instances: [{ prompt: "A cute robot" }],
            parameters: { sampleCount: 1 }
        });
        console.log('✅ Imagen OK');
    } catch (err) {
        console.log('❌ Imagen FAILED');
        if (err.response) {
            console.log(`   Status: ${err.response.status}`);
            console.log(`   Data: ${JSON.stringify(err.response.data)}`);
        } else {
            console.log(`   Error: ${err.message}`);
        }
    }
}

test();
