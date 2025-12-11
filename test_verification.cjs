require('dotenv').config();
const { detectNicheIntelligent, generateProfessionalPrompt } = require('./backend/services/imageGeneration/promptEngine.cjs');

const fs = require('fs');
const logStream = fs.createWriteStream('verification_log.txt', { flags: 'a' });

function log(message) {
    console.log(message);
    logStream.write(message + '\n');
}

// Mock data
const cases = [
    {
        name: "Pizzaria do Zé",
        descricao: "A melhor pizza da cidade, entrega rápida e forno a lenha.",
        pedido: "fazer um flyer top",
        expectedNiche: "pizzaria" // Should NOT be delivery
    },
    {
        name: "Consultoria Alpha",
        descricao: "Assessoria empresarial e gestão",
        pedido: "",
        expectedNiche: "profissional" // Should default to professional
    },
    {
        name: "Flash Motoboy",
        descricao: "Entregas express e logistica",
        pedido: "",
        expectedNiche: "delivery" // Should validly be delivery
    },
    {
        name: "Assistência Técnica TechFix",
        descricao: "Conserto de celulares e notebooks, troca de tela.",
        pedido: "",
        expectedNiche: "assistencia_tecnica"
    },
    {
        name: "Academia Iron",
        descricao: "Musculação e Treino Funcional",
        pedido: "",
        expectedNiche: "academia"
    },
    {
        name: "Padaria Doce Pão",
        descricao: "Pães quentinhos e bolos",
        pedido: "",
        expectedNiche: "padaria"
    },
    {
        name: "CVC Viagens",
        descricao: "Pacotes turísticos e passagens",
        pedido: "",
        expectedNiche: "viagens"
    },
    {
        name: "Pesca Esportiva Tucunaré",
        descricao: "Artigos de pesca, iscas artificiais e varas.",
        pedido: "flyer promocional de iscas",
        expectedNiche: "dynamic_creative" // Should trigger dynamic mode
    }
];

async function runTests() {
    log("🧪 STARTING VERIFICATION TESTS...\n");

    for (const c of cases) {
        log(`📋 Testing: ${c.name}`);
        const niche = await detectNicheIntelligent(c);
        
        if (niche === c.expectedNiche) {
            log(`✅ [PASS] Detected: ${niche}`);
        } else {
            log(`❌ [FAIL] Expected: ${c.expectedNiche}, Got: ${niche}`);
        }
        
        const prompt = await generateProfessionalPrompt(c, niche);
        if (prompt.includes("Phone/Whatsapp:") && prompt.includes("Address:")) {
             log(`✅ [PASS] Prompt contains mandatory contact fields.`);
        } else {
             log(`❌ [FAIL] Prompt missing contact fields!`);
        }
        
        if (!prompt.includes("blurry") && !prompt.includes("bokeh")) {
             log(`✅ [PASS] Prompt free of blur keywords.`);
        } else {
             log(`❌ [FAIL] Prompt still has blur keywords!`);
        }
        log("---------------------------------------------------");
    }
}


(async () => {
    try {
        await runTests();
    } catch (e) {
        console.error("❌ FATAL TEST ERROR:", e);
    }
})();

