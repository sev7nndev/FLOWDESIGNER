
const axios = require('axios');

async function test() {
    try {
        console.log('Testing /api/debug-users-open...');
        const res = await axios.get('http://localhost:3002/api/debug-users-open');
        console.log('--- RESPONSE DATA ---');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.log('Status:', e.response.status);
            console.log('Data:', e.response.data);
        }
    }
}
test();
