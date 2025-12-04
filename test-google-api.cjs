const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config({ path: '.env.local' });
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('🔑 Testing API Key:', API_KEY ? 'Present' : 'Missing');

async function testModels() {
    try {
        console.log('📡 Listing models...');
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent("Hello, are you working?");
        console.log('✅ Gemini Text Generation: OK');
        console.log('Response:', result.response.text());

        // Test Imagen REST Endpoint availability
        console.log('\n🎨 Testing Imagen REST Endpoint...');
        const imagenModel = 'imagen-3.0-generate-001';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${imagenModel}:predict?key=${API_KEY}`;

        try {
            const response = await axios.post(url, {
                instances: [{ prompt: "A cute robot drawing" }],
                parameters: { sampleCount: 1 }
            });
            console.log('✅ Imagen Generation: OK');
        } catch (err) {
            console.error('❌ Imagen Generation Failed:');
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', JSON.stringify(err.response.data, null, 2));
            } else {
                console.error(err.message);
            }
        }

    } catch (error) {
        console.error('❌ General Error:', error);
    }
}

testModels();
