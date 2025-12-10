const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { generate } = require('./services/imageGeneration/fallbackChain.cjs');

// Mock Data
const mockBusiness = {
    nome: "Pizzaria Bella Italia",
    descricao: "As melhores pizzas artesanais da cidade",
    whatsapp: "(11) 99999-9999",
    instagram: "@bellaitalia",
    address: "Rua das Flores, 123",
    pedido: "Flyer promocional de pizza de calabresa"
};

async function test() {
    console.log("🧪 Starting Generation Test...");
    try {
        const result = await generate(mockBusiness);
        console.log("✅ Success!");
        console.log("Prompt Used:", result.prompt);
        console.log("Method:", result.method);
        console.log("Niche:", result.niche);
        console.log("Image Base64 Length:", result.imageBase64.length);
    } catch (e) {
        console.error("❌ Test Failed:", e.message);
    }
}

test();
