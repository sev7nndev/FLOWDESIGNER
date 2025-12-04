const axios = require('axios');

async function check() {
    try {
        const res = await axios.get('http://localhost:3002/api/debug-profiles');
        console.log('Result:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}
check();
