
const axios = require('axios');

async function test() {
    try {
        console.log('Testing /api/debug-profiles...');
        const res = await axios.get('http://localhost:3002/api/debug-profiles');
        console.log('\n--- PROFILES ---');
        if (res.data.profiles) {
            res.data.profiles.forEach(p => {
                console.log(`ID: ${p.id} | Email: ${p.email} | Role: ${p.role} | Owner: ${p.role === 'owner' ? '✅' : '❌'}`);
            });
        } else {
            console.log('No profiles data found or format mismatch.');
            console.log(res.data);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
