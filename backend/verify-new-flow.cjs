
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const ultraGenerator = require('./ultraAdvancedImagenGenerator.cjs');
const fs = require('fs');

async function verifyFlow() {
    console.log("🧪 Verifying New Image Generation Flow (3:4 Ratio)...");

    const mockBusinessData = {
        niche: "estetica",
        nome: "Dra. Ana Estética",
        telefone: "(11) 98888-5555",
        whatsapp: "(11) 98888-5555",
        address: "Av. Paulista, 1000",
        instagram: "@dra.anaestetica",
        briefing: "Harmonização facial e botox. Mulher sorrindo, pele perfeita."
    };

    try {
        const start = Date.now();
        const base64 = await ultraGenerator.generateProfessionalFlyer(mockBusinessData);
        const duration = (Date.now() - start) / 1000;

        console.log(`✅ Generation Successful in ${duration}s`);
        
        // Save to verify ratio/content
        const outputPath = path.join(__dirname, 'test-outputs', `verify_3_4_${Date.now()}.png`);
        if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        
        fs.writeFileSync(outputPath, base64, 'base64');
        console.log(`💾 Image saved to: ${outputPath}`);

    } catch (error) {
        console.error("❌ Verification Failed:", error.message);
        const logContent = JSON.stringify({
            message: error.message,
            response: error.response?.data || 'No response data'
        }, null, 2);
        try { fs.writeFileSync(path.join(__dirname, 'verify_error_recheck.json'), logContent); } catch(e){}
    }
}

verifyFlow();
