const axios = require('axios');
const fs = require('fs');

async function testAdvocacyGeneration() {
    console.log('⚖️ Testing Advocacy Flyer Generation...');
    try {
        const response = await axios.post('http://localhost:3001/api/generate', {
            promptInfo: {
                companyName: "Silva Advocacia",
                details: "Especialista em Direito Penal e Trabalhista. Plantão 24h.",
                phone: "(11) 99999-9999",
                addressStreet: "Rua da Lei",
                addressNumber: "100",
                addressNeighborhood: "Centro",
                addressCity: "São Paulo"
            },
            artStyle: { label: "Cinematic 3D" } // Should be overridden by Niche logic if correctly implemented or used as base
        }, {
            headers: { 'x-bypass-auth': 'testing-secret-123' }
        });

        console.log('✅ Generation Success!');
        console.log('Image URL:', response.data.image.image_url.slice(0, 50) + '...');

        // Save base64 to check aesthetics manually if needed
        const base64Data = response.data.image.image_url.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync('advocacy_test_output.png', base64Data, 'base64');
        console.log('🖼️ Image saved to advocacy_test_output.png');

    } catch (error) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
    }
}

testAdvocacyGeneration();
