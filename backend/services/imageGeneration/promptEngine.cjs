const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retryWithBackoff } = require('../../utils/retryWithBackoff.cjs');
const NICHE_PROMPTS = require('./nicheContexts.cjs');

// Initialize Gemini with fixed model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const classificationModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

/**
 * Regex-based Niche Detection (Fast)
 */
function detectNicheByRegex(text) {
    if (!text) return null;
    text = text.toLowerCase();

    // Map regex to keys in NICHE_PROMPTS
    const patterns = [
        { key: 'mecanica', regex: /\b(mec[âa]nica|oficina|carro|automotivo|auto pe[çc]as|funilaria)\b/ },
        { key: 'assistencia_tecnica', regex: /\b(assist[êe]ncia|t[ée]cnica|conserto|manuten[çc][ãa]o|celular|iphone|notebook|computador)\b/ },
        { key: 'estetica_automotiva', regex: /\b(lava r[áa]pido|lavagem|polimento|detail|car wash|higieniza[çc][ãa]o)\b/ },
        { key: 'pizzaria', regex: /\b(pizza|forno a lenha|pizzaiolo)\b/ },
        { key: 'academia', regex: /\b(academia|gym|treino|muscula[çc][ãa]o|crossfit|personal trainer|fitness)\b/ },
        { key: 'padaria', regex: /(padaria|confeitaria|panificadora|p[ãa]o|bolo|torta|doce)/ },
        { key: 'cafeteria', regex: /\b(caf[ée]s?|cafeteria|capuccino|espresso|barista)\b/ },
        { key: 'supermercado', regex: /\b(supermercado|mercado|hortifruti|a[çc]ougue|mercadinho|compras)\b/ },
        { key: 'moda', regex: /\b(moda|roupas?|loja de roupas?|vestu[áa]rio|boutique|cal[çc]ados?|estilo)\b/ },
        { key: 'viagens', regex: /\b(viag(?:em|ens)|turismo|ag[êe]ncia de viagens?|passagens?|pacotes?|hotel)\b/ },
        { key: 'eventos', regex: /\b(festas?|eventos?|casamento|anivers[áa]rio|buffets?|decora[çc][ãa]o)\b/ },
        { key: 'educacao', regex: /\b(escola|cursos?|aulas?|ensino|educa[çc][ãa]o|col[ée]gio|tutorial)\b/ },
        { key: 'limpeza', regex: /\b(limpeza|faxina|higieniza[çc][ãa]o|dedetiza[çc][ãa]o|lavanderia)\b/ },
        { key: 'seguranca', regex: /\b(seguran[çc]a|vigil[âa]ncia|c[âa]meras?|alarms?|monitoramento)\b/ },
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

        const result = await retryWithBackoff(
            async () => await classificationModel.generateContent(prompt),
            {
                maxRetries: 3,
                initialDelayMs: 1000,
                onRetry: (attempt, delay) => {
                    console.log(`⏳ Retry ${attempt}/3 para classificação de nicho em ${Math.round(delay/1000)}s`);
                }
            }
        );
        
        const detected = result.response.text().trim().toLowerCase();
        
        if (NICHE_PROMPTS[detected]) {
            console.log(`🧠 [Niche] Gemini identified: ${detected}`);
            return detected;
        }
    } catch (e) {
        console.warn('⚠️ [Niche] Gemini classification failed:', e.message);
    }
    
    return 'dynamic_creative'; // Smart Fallback to Dynamic Mode
}

/**
 * Generates a dynamic visual context for unknown niches using Gemini
 */
async function generateDynamicNicheContext(businessData) {
    console.log(`🧠 [Dynamic] Generating custom context for: ${businessData.nome}`);
    const prompt = `
    You are an expert Art Director. The user has a business named "${businessData.nome}" offering "${businessData.descricao}".
    This business does NOT fit into standard categories.
    Create a custom visual "Briefing" for a High-End Advertising Flyer.

    Return JSON ONLY with these keys:
    {
      "scene": "detailed description of the background scene, photorealistic, 8k",
      "elements": "list of 4-5 visual elements, props, or tools related to this specific business",
      "colors": ["#hex (Name)", "#hex (Name)", "#hex (Name)"],
      "mood": "3-4 adjectives describing the vibe (e.g. Mysterious, High-Tech, Organic)",
      "textStyle": "Best font style description for this business",
      "negative": "what to avoid in this specific scene"
    }
    Include "sharp focus" and "high resolution" in the scene.
    DO NOT return markdown code blocks, just the JSON string.
    `;

    try {
        const result = await retryWithBackoff(
            async () => await classificationModel.generateContent(prompt),
            {
                maxRetries: 3,
                initialDelayMs: 1000
            }
        );
        
        const text = result.response.text().replace(/```json|```/g, '').trim();
        const context = JSON.parse(text);
        console.log(`🎨 [Dynamic] Context created:`, context.mood);
        return context;
    } catch (e) {
        console.warn(`⚠️ [Dynamic] Failed to generate context, falling back to professional:`, e.message);
        return NICHE_PROMPTS['profissional'];
    }
}

/**
 * Prompt Engineer
 * Generates the perfect Imagen 4.0 prompt based on niche and data.
 */
async function generateProfessionalPrompt(businessData, niche, customContext = null) {
    const context = customContext || NICHE_PROMPTS[niche] || NICHE_PROMPTS['profissional'];
    
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
    generateProfessionalPrompt,
    generateDynamicNicheContext,
    condensePrompt: (prompt) => {
        // Simple truncation fallback since Gemini condenser was causing issues
        if (!prompt || prompt.length < 1000) return prompt;
        return prompt.substring(0, 1000);
    }
};
