const { GoogleGenerativeAI } = require('@google/generative-ai');
const NICHE_PROMPTS = require('./nicheContexts.cjs');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const classificationModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Regex-based Niche Detection (Fast)
 */
function detectNicheByRegex(text) {
    if (!text) return null;
    text = text.toLowerCase();

    // Map regex to keys in NICHE_PROMPTS
    const patterns = [
        { key: 'mecanica', regex: /\b(mec[âa]nica|oficina|carro|automotivo|auto pe[çc]as|funilaria)\b/ },
        { key: 'estetica_automotiva', regex: /\b(lava r[áa]pido|lavagem|polimento|detail|car wash|higieniza[çc][ãa]o)\b/ },
        { key: 'pizzaria', regex: /\b(pizza|forno a lenha|pizzaiolo)\b/ },
        { key: 'hamburgueria', regex: /\b(hamburguer|burger|burguer|artesanal|smash)\b/ },
        { key: 'sushi', regex: /\b(sushi|japon[êe]s|temaki|yakisoba|oriental)\b/ },
        { key: 'acai', regex: /\b(a[çc]a[íi]|sorvete|gelado|cupuacu)\b/ },
        { key: 'restaurante', regex: /\b(restaurante|almo[çc]o|jantar|comida|refei[çc][ãa]o|marmita)\b/ },
        { key: 'salao_beleza', regex: /\b(sal[ãa]o|cabelo|cabeleireir|mechas|corte)\b/ },
        { key: 'barbearia', regex: /\b(barber|barbearia|barba|cortes masculinos)\b/ },
        { key: 'manicure', regex: /\b(manicure|unhas|esmalteria|pedicure|nail)\b/ },
        { key: 'estetica', regex: /\b(est[ée]tica|harmoniza[çc][ãa]o|botox|preenchimento|facial|corporal)\b/ },
        { key: 'odontologia', regex: /\b(dentista|odonto|dentes|sorriso|implante|clareamento)\b/ },
        { key: 'petshop', regex: /\b(pet|banho e tosa|veterin[áa]ri|ra[çc][ãa]o|animal)\b/ },
        { key: 'imobiliaria', regex: /\b(imobili[áa]ria|im[óo]veis|aluguel|venda de casa|apartamento|corretor)\b/ },
        { key: 'solar', regex: /\b(solar|energia|fotovoltaica|placas)\b/ },
        { key: 'climatizacao', regex: /\b(ar condicionado|climatiza[çc][ãa]o|refrigera[çc][ãa]o|instala[çc][ãa]o)\b/ },
        { key: 'advogado', regex: /\b(advogado|jur[íi]dico|oab|direito|lei)\b/ },
        { key: 'contabilidade', regex: /\b(contabil|contador|imposto|financeiro)\b/ },
        // Delivery LAST to avoid false positives on "entrega rapida"
        { key: 'delivery', regex: /\b(motoboy|entregas? express|log[íi]stica|transportadora)\b/ } 
    ];

    for (const p of patterns) {
        if (p.regex.test(text)) return p.key;
    }
    return null;
}

/**
 * Intelligent Niche Detector
 * Tries Regex -> Fallback to Gemini
 */
async function detectNicheIntelligent(businessData) {
    const fullText = `${businessData.nome} ${businessData.descricao || ''} ${businessData.pedido || ''}`;
    
    // 1. Try Fast Regex
    const regexMatch = detectNicheByRegex(fullText);
    if (regexMatch) {
        console.log(`⚡ [Niche] Fast Regex identified: ${regexMatch}`);
        return regexMatch;
    }

    // 2. Use Gemini Classifier
    console.log(`🧠 [Niche] Regex failed. Asking Gemini to classify: "${fullText.substring(0, 50)}..."`);
    
    try {
        const prompt = `Classify this business into one of these exact keys: ${Object.keys(NICHE_PROMPTS).join(', ')}.
Business Name: ${businessData.nome}
Description: ${businessData.descricao || ''}
Request: ${businessData.pedido || ''}

If it fits none perfectly, choose the closest one or "profissional" as last resort.
RETURN ONLY THE KEY NAME. NO JSON. NO EXPLANATION.`;

        const result = await classificationModel.generateContent(prompt);
        const detected = result.response.text().trim().toLowerCase();
        
        if (NICHE_PROMPTS[detected]) {
            console.log(`🧠 [Niche] Gemini identified: ${detected}`);
            return detected;
        }
    } catch (e) {
        console.warn('⚠️ [Niche] Gemini classification failed:', e.message);
    }
    
    return 'profissional'; // Fallback
}

/**
 * Prompt Engineer
 * Generates the perfect Imagen 4.0 prompt based on niche and data.
 */
async function generateProfessionalPrompt(businessData, niche) {
    const context = NICHE_PROMPTS[niche] || NICHE_PROMPTS['profissional'];
    
    // Construct the prompt manually (Template-based) to ensure strict adherence
    // We use English for the prompt instructions as Imagen follows them better
    
    const prompt = `
Generate a PHOTOREALISTIC, HIGH-QUALITY ADVERTISING FLYER.
Niche: ${niche.toUpperCase()} - ${context.mood}

VISUAL DESCRIPTION:
Scene: ${context.scene}
Elements: ${context.elements}
Lighting: Professional studio lighting, cinematic, 8k resolution, sharp focus.
Colors: Palette of ${context.colors.join(', ')}.
Style: ${businessData.logo ? "Clean modern layout integrated with the logo" : "Professional 3D typography layout"}.
Negative Prompt: ${context.negative || "amateur, blurry, distorted, messy, bad composition, watermark, text cutoff, cropping, low quality"}.

TEXT CONTENT INSTRUCTIONS (CRITICAL):
You MUST render the following text in PERFECT PORTUGUESE (PT-BR).
Font: ${context.textStyle}.
Text must be LEGILE, SHARP, and INTEGRATED into the design (not just an overlay).

TEXT TO RENDER (MANDATORY):
1. HEADLINE (Big): "${businessData.nome}"
2. SUBTITLE (Medium): "${businessData.pedido || businessData.descricao || businessData.servicos || ''}"
3. CONTACT INFO (Bottom, Small but Clear):
   - Phone/Whatsapp: "${businessData.whatsapp || businessData.telefone}"
   - Address: "${businessData.address || ''}"
   - Social: "${businessData.instagram ? 'Insta: ' + businessData.instagram : ''}"

COMPOSITION RULES:
- Portrait 9:16 aspect ratio.
- Leave space at top for headline.
- Leave space at bottom for contact info.
- No spelling errors.
- Do NOT use "lorem ipsum" or gibberish.
`.trim();

    return prompt;
}

module.exports = {
    detectNicheIntelligent,
    generateProfessionalPrompt
};
