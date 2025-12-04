const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testImagen() {
    console.log('🎨 Testing Imagen (REST)...');
    const imagenModel = 'imagen-4.0-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${imagenModel}:predict?key=${API_KEY}`;

    try {
        const response = await axios.post(url, {
            instances: [{ prompt: "A cute robot" }],
            parameters: { sampleCount: 1 }
        });
        console.log('✅ Imagen SUCCESS!');
        console.log('Response keys:', Object.keys(response.data));
    } catch (err) {
        console.log('❌ Imagen FAILED');
        if (err.response) {
            console.log(`Status: ${err.response.status}`);
            console.log(`Data: ${JSON.stringify(err.response.data, null, 2)}`);
        } else {
            console.log(`Error: ${err.message}`);
        }
    }
}

testImagen();
