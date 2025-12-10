
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const ultraGenerator = require('./ultraAdvancedImagenGenerator.cjs');
const fs = require('fs');

async function verifyFreepikFlow() {
    console.log("🧪 Verificando Integração Freepik API...");

    const mockBusinessData = {
        niche: "hamburgueria",
        nome: "King Burger",
        telefone: "(11) 99999-8888",
        whatsapp: "(11) 99999-8888",
        address: "Av. Paulista, 1000 - SP",
        instagram: "@kingburger",
        briefing: "Promoção de X-Bacon com fritas e refri. Hamburguer gourmet."
    };

    try {
        const start = Date.now();
        const base64 = await ultraGenerator.generateProfessionalFlyer(mockBusinessData);
        const duration = (Date.now() - start) / 1000;

        console.log(`✅ Geração Freepik Successful in ${duration}s`);
        
        // Save to verify
        const outputPath = path.join(__dirname, 'test-outputs', `freepik_test_${Date.now()}.png`);
        if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        
        fs.writeFileSync(outputPath, base64, 'base64');
        console.log(`💾 Image saved to: ${outputPath}`);

    } catch (error) {
        console.error("❌ Verification Failed:", error.message);
        const logContent = JSON.stringify({
            message: error.message,
            response: error.response?.data || 'No response data'
        }, null, 2);
        try { fs.writeFileSync(path.join(__dirname, 'verify_freepik_error.json'), logContent); } catch(e){}
    }
}

verifyFreepikFlow();
