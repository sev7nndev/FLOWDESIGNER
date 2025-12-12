
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { generate } = require('./services/imageGeneration/fallbackChain.cjs');

async function verifyFix() {
    console.log("🚀 Testing Fix with Long Prompt (1200 chars)...");
    
    // Create a dummy long prompt (Realistic text, not repetitive spam)
    const longPrompt = "Uma padaria artesanal especializada em pães de fermentação natural, bolos decorados para festas, doces finos e salgados diversos. Oferecemos também café da manhã completo com sucos naturais, sanduíches e tapiocas. Ambiente climatizado e aconchegante para toda a família. Aceitamos encomendas para eventos corporativos e aniversários. Entrega rápida em toda a região. Venha conhecer nossas delícias e se surpreender com o sabor inigualável dos nossos produtos feitos com amor e dedicação. Preços promocionais para pagamentos via Pix. ".repeat(10); 
    // Approx 300 chars * 10 = 3000 chars (will be truncated) 

    const businessData = {
        nome: "Teste Fix",
        descricao: longPrompt,
        pedido: "Flyer"
    };

    try {
        const result = await generate(businessData);
        console.log("\n✅ Generation SUCCESS!");
        console.log("Method used:", result.method);
    } catch (e) {
        console.error("\n❌ Generation FAILED:", e.message);
    }
}

verifyFix();
