const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load Env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const ultraGenerator = require('../backend/ultraAdvancedImagenGenerator.cjs');

const runTest = async () => {
    console.log("🧪 STARTING IMAGEN FALLBACK TEST...");
    
    const businessData = {
        nome: "Teste Fallback",
        niche: "Hamburgueria", 
        descricao: "Melhor burger da cidade",
        pedido: "Promoção de X-Bacon",
        servicos: "Delivery, Ifood, Retirada",
        whatsapp: "(11) 99999-9999",
        telefone: "(11) 3333-3333", 
        instagram: "@burger.teste",
        address: "Rua Teste, 123",
        site: "www.teste.com.br"
    };

    try {
        console.log("🧠 [TEST] Invoking Generator (Expect Ultra -> 429 -> Fast)...");
        
        const start = Date.now();
        const base64Image = await ultraGenerator.generateProfessionalFlyer(businessData);
        
        const duration = (Date.now() - start) / 1000;
        console.log(`✅ Generation Complete in ${duration}s!`);

        // Save to Artifacts
        const artifactsDir = "C:\\Users\\seven beatx\\.gemini\\antigravity\\brain\\26344334-d16f-4d90-8343-7e875de2e2a0";
        const outputPath = path.join(artifactsDir, "fallback_test_result.png");
        
        fs.writeFileSync(outputPath, Buffer.from(base64Image, 'base64'));
        console.log(`💾 Image saved to: ${outputPath}`);

    } catch (e) {
        console.error("❌ TEST FAILED:", e.stack || e);
    }
};

runTest();
