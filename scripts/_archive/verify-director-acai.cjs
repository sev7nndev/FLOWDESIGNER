const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BASE_URL = 'http://localhost:3001';

async function testDirector() {
    console.log('🧪 Testing Director Agent with "Açaí do Mano" Case...');

    // Mock User Token (using bypass header if available, or just mocking auth if server allows)
    // server.cjs has: if (req.headers['x-bypass-auth'] === 'testing-secret-123')
    const headers = {
        'Content-Type': 'application/json',
        'x-bypass-auth': 'testing-secret-123'
    };

    const payload = {
        promptInfo: {
            companyName: "Açaí do Mano",
            details: "Açaí puro, cremoso e gelado. Mais de 30 acompanhamentos. Delivery rápido. Promoção: Açaí 500ml + 3 acompanhamentos por R$ 15",
            addressStreet: "Travessa Quintino",
            addressNumber: "66",
            addressNeighborhood: "Bairro Cremação",
            addressCity: "Belém",
            phone: "(91) 98777-6666"
        },
        artStyle: {
            label: "Neon & Vibrante", // Choosing a style that fits usage
            prompt: "vibrant colors, purple and yellow, energy"
        }
    };

    try {
        // We expect this to take some time as it calls Gemini
        const response = await axios.post(`${BASE_URL}/api/generate`, payload, { headers, timeout: 60000 });

        if (response.data) {
            console.log('✅ Generation Request Successful');
            // The Director Prompt is logged on the server, not returned in response.
            // We will look at the server logs running in the background.
            // But we can check if the response contains the IMAGE (indicating success).
            console.log('Response ID:', response.data.image?.id);
        }
    } catch (error) {
        if (error.response) {
            console.error('❌ Error Status:', error.response.status);
            console.error('❌ Error Data:', error.response.data);
        } else {
            console.error('❌ Error Message:', error.message);
        }
    }
}

testDirector();
