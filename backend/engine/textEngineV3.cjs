const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeImageLayoutV3({ data }) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
Você é um DIRETOR DE ARTE PREMIUM BRASILEIRO.  
Seu trabalho: Criar o **layout final** igual ao estilo Nano Banana.
⚠️ Não gere imagem. Gere SOMENTE JSON.

ESTRUTURA OBRIGATÓRIA:

{
 "panel": {
    "heightPercent": 38,
    "background": "#FFFFFF",
    "radius": 40,
    "shadow": "0px 8px 30px rgba(0,0,0,0.25)",
    "padding": 40
 },
 "text": {
    "headline": "...",
    "subheadline": "...",
    "contacts": [
        "WhatsApp: ...",
        "Instagram: ...",
        "Endereço: ..."
    ]
 }
}

REGRAS:
- Sempre criar um painel branco com bordas arredondadas.
- Sempre centralizar todo o texto.
- Sempre usar fonte Montserrat.
- SEM ERROS DE PORTUGUÊS.
- SE O CLIENTE ENVIOU UM DADO, ELE DEVE APARECER.
- Contatos sempre ficam dentro do painel inferior.
- Nenhum campo pode ficar vazio: se não existir, simplesmente omita do array.
- headline = nome da empresa
- subheadline = slogan ou descrição curta
- contacts = array com WhatsApp, Instagram, Endereço (apenas os que existirem)

Dados do cliente:
${JSON.stringify(data, null, 2)}

RETORNE APENAS O JSON VÁLIDO, SEM MARKDOWN, SEM EXPLICAÇÕES.
`;

        const result = await model.generateContent(prompt);
        const raw = result.response.text().replace(/```json|```/g, "").trim();
        const json = JSON.parse(raw);

        console.log("✅ V3 Engine - Layout gerado:", JSON.stringify(json, null, 2));
        return json;
    } catch (e) {
        console.error("❌ V3 Engine Error:", e);
        return fallbackNanoLayout(data);
    }
}

function fallbackNanoLayout(data) {
    console.log("⚠️ Usando fallback Nano Banana layout");
    console.log("📋 Dados recebidos:", JSON.stringify(data, null, 2));

    const contacts = [];

    // WhatsApp/Phone
    if (data.phone) {
        contacts.push(`📱 WhatsApp: ${data.phone}`);
    } else if (data.whatsapp) {
        contacts.push(`📱 WhatsApp: ${data.whatsapp}`);
    }

    // Instagram
    if (data.instagram) {
        const insta = data.instagram.replace('@', '');
        contacts.push(`📷 Instagram: @${insta}`);
    }

    // Endereço
    if (data.addressStreet || data.addressCity) {
        let addr = '';
        if (data.addressStreet) {
            addr += data.addressStreet;
            if (data.addressNumber) addr += `, ${data.addressNumber}`;
            if (data.addressNeighborhood) addr += ` - ${data.addressNeighborhood}`;
        }
        if (data.addressCity) {
            addr += addr ? ` - ${data.addressCity}` : data.addressCity;
        }
        if (addr) contacts.push(`📍 ${addr}`);
    }

    const layout = {
        panel: {
            heightPercent: 38,
            background: "#FFFFFF",
            radius: 40,
            shadow: "0px 8px 30px rgba(0,0,0,0.25)",
            padding: 40
        },
        text: {
            headline: data.companyName || "Sua Marca",
            subheadline: data.details || data.slogan || "",
            contacts: contacts
        }
    };

    console.log("✅ Layout fallback gerado:", JSON.stringify(layout, null, 2));
    return layout;
}

module.exports = { analyzeImageLayoutV3 };
