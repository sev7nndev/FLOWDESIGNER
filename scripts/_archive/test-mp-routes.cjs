const axios = require('axios');

async function testRoutes() {
    const baseUrl = 'http://localhost:3005/api'; // Correct port 3005
    console.log('🔍 Testing MP Admin Routes...');

    try {
        // 1. Status Check
        console.log('1. Checking MP Status...');
        const statusRes = await axios.get(`${baseUrl}/admin/mp-status`);
        console.log('   ✅ Status Response:', statusRes.data);

        // 2. Connect URL
        console.log('2. Requesting Connect URL (Expect 401 if unauth)...');
        try {
            const connectRes = await axios.get(`${baseUrl}/admin/mp-connect`);
            console.log('   ✅ Connect URL:', connectRes.data.url);
        } catch (e) {
            console.log('   ℹ️ Connect URL Protected:', e.response?.status); // Expect 401
        }

    } catch (e) {
        console.error('❌ Route Test Failed:', e.message);
        if (e.response) console.error('   Status:', e.response.status, e.response.data);
    }
}

testRoutes();
