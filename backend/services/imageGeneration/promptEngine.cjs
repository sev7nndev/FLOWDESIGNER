// FLOW Prompt Engine (v2.0)
// Responsibilities: Detect Niche & Generate Context-Aware Prompts
const { NICHE_PROMPTS } = require('./nicheContexts.cjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class PromptEngine {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Determines the business niche using Regex (Fast) or Gemini (Smart)
     */
    async detectNiche(businessData) {
        const textToAnalyze = `${businessData.nome} ${businessData.descricao} ${businessData.servicos || ''}`.toLowerCase();
        
        // 1. FAST CHECK: Regex Pattern Matching
        // Inverted lookup: Search NICHE_PROMPTS values for keywords that match our text
        for (const [key, value] of Object.entries(NICHE_PROMPTS)) {
            const keywords = value.keywords || [];
            // Direct niche name match or keyword match
            if (textToAnalyze.includes(key) || keywords.some(k => textToAnalyze.includes(k))) {
                console.log(`⚡ [Niche Detect] Fast Match: ${key}`);
                return key;
            }
        }

        // 2. SMART CHECK: Gemini Classification
        console.log('🤖 [Niche Detect] Using Gemini for classification...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Classify this business into one of these IDs: ${Object.keys(NICHE_PROMPTS).join(', ')}.
            
            Business Name: ${businessData.nome}
            Description: ${businessData.descricao}
            Services: ${businessData.servicos}
            
            Return ONLY the ID string. If unsure, return 'profissional'.`;

            const result = await model.generateContent(prompt);
            let id = result.response.text().trim().toLowerCase();
            
            // Validate ID exists
            if (!NICHE_PROMPTS[id]) id = 'profissional';
            
            console.log(`🤖 [Niche Detect] Gemini Classified: ${id}`);
            return id;

        } catch (e) {
            console.error('Niche detection error:', e);
            return 'profissional';
        }
    }

    /**
     * Generates a Photorealistic Prompt for Imagen 4.0
     */
    generatePrompt(businessData, nicheKey) {
        const context = NICHE_PROMPTS[nicheKey] || NICHE_PROMPTS['profissional'];
        
        // Construct the prompt
        // We focus on VISUALS first, then TEXT embedding.
        
        let prompt = `Create a professional marketing flyer for a ${nicheKey.replace('_', ' ')} business.
        
VISUAL SCENE:
${context.scene}.
Key Elements: ${context.elements}.
Atmosphere/Mood: ${context.mood}.
Color Palette: ${context.colors.join(', ')}.

TEXT TO EMBED (Must be perfectly legible, sans-serif, high contrast):
Headline: "${businessData.nome}"
Subtext: "${businessData.pedido || businessData.descricao || ''}"
Phone: "${businessData.whatsapp || businessData.telefone || ''}"
Address: "${businessData.address || ''}"

TECHNICAL STYLE:
- Photorealistic 8K render
- Commercial advertising photography
- ${context.textStyle} typography for the text
- Text must be cleanly integrated into the image, not floating.
- Main subject centered or slightly off-center to allow text space.
- NO spelling errors.
`;

        return prompt;
    }
}

module.exports = new PromptEngine();
