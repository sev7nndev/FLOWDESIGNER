const axios = require('axios');

async function testGeneration() {
    console.log('🚀 Sending request to localhost:3002 (Production Port)...');
    try {
        const response = await axios.post('http://localhost:3002/api/generate', {
            promptInfo: {
                companyName: "Teste Auto Shop",
                details: "A beautiful car repair shop flyer"
            }
        }, {
            headers: {
                'x-bypass-auth': 'testing-secret-123',
                'Content-Type': 'application/json'
            },
            timeout: 120000 // 2 minutes
        });

        console.log('✅ Status:', response.status);
        console.log('✅ Data:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    } catch (error) {
        console.error('❌ Request Failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testGeneration();
