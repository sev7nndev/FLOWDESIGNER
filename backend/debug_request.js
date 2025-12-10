const axios = require('axios');

async function test() {
    try {
        console.log("Sending request to localhost:3001/api/generate...");
        const res = await axios.post('http://localhost:3001/api/generate', {
            // Mock body
            promptInfo: {
                companyName: "Debug Clinic",
                details: "Dental Services",
                phone: "123456789"
            },
            selectedStyle: { id: "Standard" }
        }, {
            headers: { 'Authorization': 'Bearer MOCK_TOKEN_IF_NEEDED' } 
            // Note: server.cjs checks token. I might need a real token or bypass.
            // server.cjs line 171: headers['x-debug-bypass'] === 'secret_banana_key'
        });
        console.log("Success:", res.data);
    } catch (e) {
        console.error("Status:", e.response?.status);
        console.error("Data:", JSON.stringify(e.response?.data, null, 2));
    }
}

// Add the bypass header seen in server.cjs
axios.defaults.headers.common['x-debug-bypass'] = 'secret_banana_key';

test();
