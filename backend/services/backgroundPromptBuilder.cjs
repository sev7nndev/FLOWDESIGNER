/**
 * BACKGROUND PROMPT BUILDER
 * Cria prompts para gerar backgrounds visuais profissionais
 * Estilo: Escuro, tecnológico, fotorrealista (como as referências)
 */

const { getUniversalTemplate } = require('./universalTemplates.cjs');

function buildBackgroundPrompt(businessData, niche) {
    const template = getUniversalTemplate(niche);
    
    // Prompts específicos por nicho (SEM TEXTO)
    const nicheBackgrounds = {
        'automotive': `
Professional automotive service background. Dark industrial setting with:
- Luxury car in modern garage
- Tech circuit patterns overlay
- Neon blue and orange lighting
- Professional tools and equipment
- Cinematic composition
- Photorealistic 3D render
- Dark background with glowing accents
NO TEXT. Visual only. Ultra professional.
        `.trim(),
        
        'technology': `
High-tech professional background. Dark futuristic setting with:
- Circuit board patterns
- Neon blue lighting effects
- Modern tech devices
- Holographic elements
- Professional workspace
- Cinematic lighting
- Dark background with tech elements
NO TEXT. Visual only. Ultra professional.
        `.trim(),
        
        'home': `
Professional home services background. Modern setting with:
- Luxury bathroom or spa
- Blue neon lighting
- Water effects and bubbles
- Professional tools
- Clean modern environment
- Cinematic composition
- Dark background with blue accents
NO TEXT. Visual only. Ultra professional.
        `.trim(),
        
        'fitness': `
Professional fitness background. Modern gym setting with:
- Athletic equipment
- Dynamic lighting (blue/orange)
- Energetic atmosphere
- Professional gym environment
- Cinematic composition
- Dark background with neon accents
NO TEXT. Visual only. Ultra professional.
        `.trim(),
        
        'food': `
Professional restaurant background. Modern kitchen with:
- Gourmet food presentation
- Warm lighting (orange/red)
- Professional kitchen equipment
- Appetizing atmosphere
- Cinematic composition
- Dark background with warm accents
NO TEXT. Visual only. Ultra professional.
        `.trim(),
        
        'beauty': `
Professional beauty salon background. Elegant setting with:
- Modern salon interior
- Soft pink/purple lighting
- Luxury beauty products
- Elegant atmosphere
- Cinematic composition
- Dark background with elegant accents
NO TEXT. Visual only. Ultra professional.
        `.trim(),
        
        'professional': `
Corporate professional background. Modern office with:
- Sleek business environment
- Blue corporate lighting
- Professional workspace
- Clean modern design
- Cinematic composition
- Dark background with blue accents
NO TEXT. Visual only. Ultra professional.
        `.trim()
    };
    
    // Usar prompt específico do nicho ou genérico
    const basePrompt = nicheBackgrounds[niche] || nicheBackgrounds['professional'];
    
    // Adicionar instruções gerais
    const fullPrompt = `
${basePrompt}

CRITICAL REQUIREMENTS:
- NO TEXT whatsoever in the image
- NO logos, NO words, NO letters
- Only visual background
- Photorealistic 3D render
- Cinematic lighting
- Professional quality
- Dark background with neon accents
- Modern and sleek design

This is a BACKGROUND ONLY for text overlay.
    `.trim();
    
    return fullPrompt;
}

module.exports = {
    buildBackgroundPrompt
};
