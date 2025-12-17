require('dotenv').config();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testImagen() {
    console.log('🧪 Testando Imagen 4.0 ULTRA com nova API Key...\n');
    console.log(`🔑 API Key: ${GEMINI_API_KEY?.substring(0, 20)}...`);
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict?key=${GEMINI_API_KEY}`,
            {
                instances: [{
                    prompt: "A professional blue and white banner for a restaurant",
                    aspectRatio: "3:4",
                    guidanceScale: 10.0
                }],
                parameters: {
                    sampleCount: 1,
                    imageSize: "2K",
                    outputOptions: { mimeType: "image/png", compressionQuality: 100 }
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000
            }
        );
        
        console.log('✅ Sucesso!');
        console.log('Status:', response.status);
        console.log('Tem imagem?', !!response.data?.predictions?.[0]?.bytesBase64Encoded);
        console.log('Tamanho:', Math.round(response.data?.predictions?.[0]?.bytesBase64Encoded?.length / 1024), 'KB');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testImagen();
