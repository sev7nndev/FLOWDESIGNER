
const axios = require('axios');

async function test() {
    try {
        console.log('Testing /api/debug-profiles...');
        const res = await axios.get('http://localhost:3002/api/debug-profiles');
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.error('Response:', e.response.data);
        }
    }
}

test();
