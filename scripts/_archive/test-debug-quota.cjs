const axios = require('axios');

async function testDebug() {
    const userId = 'a4d52fe6-742c-436a-aaf7-3106241f5f62'; // marcosfernandesrj97
    try {
        const res = await axios.get(`http://localhost:3005/api/debug-check-quota/${userId}`);
        console.log('🔍 DEBUG RESPONSE:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

testDebug();
