const axios = require('axios');

async function testGeneration() {
  console.log('🔍 Starting End-to-End Generation Debug...');
  
  const payload = {
    // Mimic the exact payload from the frontend
    promptInfo: {
        companyName: "Debug Burger",
        phone: "99 9999-9999",
        addressStreet: "Rua Teste",
        addressNumber: "123",
        addressNeighborhood: "Centro",
        addressCity: "São Paulo",
        details: "Hamburguer artesanal com muito queijo",
        logo: "" // Empty log for test
    },
    artStyle: {
        id: "photorealistic",
        name: "Fotorealista 8k",
        promptSuffix: "hyper-realistic, 8k resolution, cinematic lighting"
    }
  };

  try {
    // 1. First, we need to bypass auth or login. 
    // Since this is a script, we might not have a session.
    // However, server.cjs usually requires auth.
    // Are we running this against localhost:3001 ?
    
    // Check if we can hit the health check
    try {
        await axios.get('http://localhost:3001/api/health-check');
        console.log('✅ Server is reachable.');
    } catch(e) {
        console.error('❌ Server is NOT running on port 3001. Please run "npm run dev" in another terminal.');
        process.exit(1);
    }
    
    // If auth is strictly required, we might fail unless we mock a token or use a special dev bypass.
    // Let's assume for this specific DEBUG script, we want to test the logic directly if possible,
    // OR we need to login first.
    
    // Attempting direct call (will likely fail with 401/403 if auth is active)
    console.log('🚀 Sending request to /api/generate-ultra...');
    const res = await axios.post('http://localhost:3001/api/generate-ultra', payload, {
        headers: {
            'Content-Type': 'application/json', 
            // 'Authorization': 'Bearer ...' // We don't have a token here easily without login flow
        }
    });

    console.log('✅ Success! Image generated.');
    console.log(JSON.stringify(res.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error Response:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401 || error.response.status === 403) {
          console.warn('⚠️ Authentication required. This script cannot easily bypass Supabase Auth.');
          console.warn('RECOMMENDATION: Modify server.cjs temporarily to allow public access to /api/generate-ultra for 1 minute testing, OR use the client-side test.');
      }
    } else {
      console.error('❌ Network/Script Error:', error.message);
    }
  }
}

testGeneration();
