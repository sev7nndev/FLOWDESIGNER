/**
 * PROMPT BUILDER SERVICE
 * 
 * O CÉREBRO DO SISTEMA - Constrói prompts estruturados e precisos para o Freepik Mystic.
 * 
 * Este serviço é responsável por:
 * - Mapear nicho → estilo visual
 * - Estruturar todos os dados do cliente de forma clara
 * - Garantir que o Freepik gere texto EXATAMENTE como fornecido
 * - Aplicar regras rígidas de qualidade (PT-BR, BRL, dados reais)
 */

const { SUPPORTED_NICHES } = require('./nicheDetectionService.cjs');

/**
 * MAPEAMENTO: NICHO → ESTILO VISUAL
 * 
 * Define cores, elementos visuais e mood para cada tipo de negócio
 */
const NICHE_VISUAL_STYLES = {
    automotive_repair: {
        colors: ['dark navy blue', 'charcoal black', 'neon cyan', 'electric orange'],
        elements: ['car silhouettes', 'automotive tools', 'speed lines', 'engine parts'],
        mood: 'premium, high-tech, trustworthy, professional',
        typography: 'bold, modern, industrial fonts'
    },
    restaurant: {
        colors: ['warm red', 'golden yellow', 'cream white', 'dark brown'],
        elements: ['food photography', 'cutlery', 'plates', 'chef elements'],
        mood: 'appetizing, welcoming, cozy, delicious',
        typography: 'elegant, readable, inviting fonts'
    },
    beauty_salon: {
        colors: ['soft pink', 'rose gold', 'white', 'lavender'],
        elements: ['elegant patterns', 'beauty tools', 'flowers', 'mirrors'],
        mood: 'elegant, feminine, luxurious, sophisticated',
        typography: 'elegant script and sans-serif combination'
    },
    real_estate: {
        colors: ['deep blue', 'gold', 'white', 'gray'],
        elements: ['building silhouettes', 'keys', 'house icons', 'skyline'],
        mood: 'professional, trustworthy, aspirational, modern',
        typography: 'clean, professional, corporate fonts'
    },
    gym_fitness: {
        colors: ['energetic red', 'black', 'neon green', 'white'],
        elements: ['fitness equipment', 'athletic silhouettes', 'energy lines'],
        mood: 'energetic, motivational, powerful, dynamic',
        typography: 'bold, strong, impactful fonts'
    },
    vehicle_documentation: {
        colors: ['professional blue', 'white', 'gray', 'green accents'],
        elements: ['documents', 'car icons', 'checkmarks', 'official seals'],
        mood: 'trustworthy, efficient, professional, reliable',
        typography: 'clean, official, readable fonts'
    },
    building_maintenance: {
        colors: ['industrial blue', 'safety orange', 'gray', 'yellow'],
        elements: ['tools', 'buildings', 'safety equipment', 'work icons'],
        mood: 'professional, reliable, safety-focused, efficient',
        typography: 'strong, clear, industrial fonts'
    },
    pet_shop: {
        colors: ['playful blue', 'warm orange', 'green', 'white'],
        elements: ['paw prints', 'pet silhouettes', 'hearts', 'bones'],
        mood: 'friendly, caring, playful, welcoming',
        typography: 'friendly, rounded, approachable fonts'
    },
    bakery: {
        colors: ['warm brown', 'cream', 'golden yellow', 'soft pink'],
        elements: ['bread', 'wheat', 'pastries', 'oven elements'],
        mood: 'warm, inviting, artisanal, delicious',
        typography: 'handwritten or artisanal fonts'
    },
    pharmacy: {
        colors: ['medical green', 'white', 'blue', 'red cross'],
        elements: ['medical cross', 'pills', 'health icons', 'care symbols'],
        mood: 'trustworthy, clean, professional, caring',
        typography: 'clean, medical, professional fonts'
    },
    clothing_store: {
        colors: ['fashion black', 'white', 'gold', 'trendy accent color'],
        elements: ['clothing items', 'hangers', 'fashion elements', 'style icons'],
        mood: 'stylish, trendy, elegant, fashionable',
        typography: 'modern, fashion-forward fonts'
    },
    technology: {
        colors: ['tech blue', 'black', 'neon green', 'white'],
        elements: ['circuit patterns', 'devices', 'tech icons', 'digital elements'],
        mood: 'modern, innovative, tech-savvy, professional',
        typography: 'futuristic, clean, tech fonts'
    },
    cleaning_services: {
        colors: ['fresh blue', 'clean white', 'green', 'light gray'],
        elements: ['cleaning tools', 'sparkles', 'bubbles', 'shine effects'],
        mood: 'fresh, clean, reliable, professional',
        typography: 'clean, simple, trustworthy fonts'
    },
    event_planning: {
        colors: ['elegant purple', 'gold', 'white', 'champagne'],
        elements: ['balloons', 'decorations', 'celebration elements', 'elegant patterns'],
        mood: 'festive, elegant, professional, creative',
        typography: 'elegant, celebratory fonts'
    },
    photography: {
        colors: ['artistic black', 'white', 'gold', 'creative accent'],
        elements: ['camera', 'lens flare', 'frames', 'artistic elements'],
        mood: 'artistic, professional, creative, elegant',
        typography: 'artistic, modern, elegant fonts'
    },
    dentistry: {
        colors: ['dental white', 'medical blue', 'mint green', 'clean gray'],
        elements: ['tooth icons', 'smile', 'dental tools', 'care symbols'],
        mood: 'professional, clean, trustworthy, caring',
        typography: 'clean, medical, friendly fonts'
    },
    law_firm: {
        colors: ['professional navy', 'gold', 'white', 'burgundy'],
        elements: ['scales of justice', 'columns', 'legal symbols', 'professional elements'],
        mood: 'authoritative, trustworthy, professional, prestigious',
        typography: 'serif, traditional, authoritative fonts'
    },
    accounting: {
        colors: ['corporate blue', 'green', 'white', 'gray'],
        elements: ['calculator', 'charts', 'numbers', 'financial icons'],
        mood: 'professional, trustworthy, precise, reliable',
        typography: 'clean, corporate, professional fonts'
    },
    construction: {
        colors: ['construction yellow', 'orange', 'black', 'gray'],
        elements: ['hard hat', 'tools', 'buildings', 'construction equipment'],
        mood: 'strong, reliable, professional, industrial',
        typography: 'bold, industrial, strong fonts'
    },
    other: {
        colors: ['professional blue', 'white', 'gray', 'accent color'],
        elements: ['modern shapes', 'professional icons', 'clean design'],
        mood: 'professional, modern, clean, versatile',
        typography: 'clean, modern, professional fonts'
    }
};

/**
 * Gera instruções de estilo visual baseadas no nicho
 */
function getStyleInstructions(niche, selectedStyle) {
    const nicheStyle = NICHE_VISUAL_STYLES[niche] || NICHE_VISUAL_STYLES.other;
    
    return `
- Color Palette: ${nicheStyle.colors.join(', ')}
- Visual Elements: ${nicheStyle.elements.join(', ')}
- Mood & Atmosphere: ${nicheStyle.mood}
- Typography Style: ${nicheStyle.typography}
- Quality: Photorealistic, 8k quality, cinematic lighting
- Style: ${selectedStyle?.name || 'Modern and professional'}
    `.trim();
}

/**
 * Gera instruções de layout baseadas no formato vertical (9:16)
 */
function getLayoutInstructions(niche) {
    return `
VERTICAL FLYER FORMAT (9:16 aspect ratio):

TOP SECTION (20% of height):
- Company name in large, bold, eye-catching typography
- Logo space in top-right corner (if logo provided)
- Clean, professional header design

MIDDLE SECTION (50% of height):
- Main visual element appropriate for ${SUPPORTED_NICHES[niche] || 'the business'}
- High-quality, photorealistic imagery
- Professional composition and lighting
- Visual elements that support the briefing content

BOTTOM SECTION (30% of height):
- Service/product description from briefing
- Contact information clearly displayed
- Address, phone, social media
- Professional footer design with good readability

LAYOUT RULES:
- Maintain clear visual hierarchy
- Ensure text areas have sufficient contrast
- Leave appropriate margins and spacing
- Balance visual elements with text content
- Professional, print-ready quality
    `.trim();
}

/**
 * Formata informações de contato de forma estruturada (SEM EMOJIS)
 */
function formatContactInfo(businessInfo) {
    const contacts = [];
    
    // Endereço completo
    const address = `${businessInfo.addressStreet}, ${businessInfo.addressNumber} - ${businessInfo.addressNeighborhood} - ${businessInfo.addressCity}`;
    contacts.push(`Address: ${address}`);
    
    // Telefone
    contacts.push(`Phone/WhatsApp: ${businessInfo.phone}`);
    
    // Email (opcional)
    if (businessInfo.email) {
        contacts.push(`Email: ${businessInfo.email}`);
    }
    
    // Redes sociais (opcionais)
    if (businessInfo.instagram) {
        contacts.push(`Instagram: ${businessInfo.instagram}`);
    }
    
    if (businessInfo.facebook) {
        contacts.push(`Facebook: ${businessInfo.facebook}`);
    }
    
    if (businessInfo.website) {
        contacts.push(`Website: ${businessInfo.website}`);
    }
    
    return contacts.join('\n');
}

/**
 * Remove markdown e caracteres especiais do texto
 */
function cleanText(text) {
    return text
        .replace(/\*\*/g, '')  // Remove bold markdown
        .replace(/\*/g, '')    // Remove italic markdown
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/---/g, '')   // Remove horizontal rules
        .replace(/\[.*?\]/g, '') // Remove links
        .trim();
}

/**
 * FUNÇÃO PRINCIPAL: Constrói o prompt completo e estruturado
 * 
 * @param {object} businessInfo - Dados do formulário do cliente
 * @param {string} niche - Nicho detectado
 * @param {object} selectedStyle - Estilo selecionado pelo usuário
 * @returns {string} - Prompt estruturado completo
 */
/**
 * Formata telefone no padrão brasileiro
 */
function formatPhone(phone) {
    // Remove tudo exceto números
    const numbers = phone.replace(/\D/g, '');
    
    // Formata (XX) XXXXX-XXXX
    if (numbers.length === 11) {
        return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
    } else if (numbers.length === 10) {
        return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
    }
    
    return phone; // Retorna original se não conseguir formatar
}

/**
 * Limpa caracteres especiais de redes sociais
 */
function cleanSocial(social) {
    return social.replace(/[@/]/g, '');
}

function buildPrompt(businessInfo, niche, selectedStyle) {
    // Limpar markdown
    const cleanedDetails = cleanText(businessInfo.details);
    
    // Formatar dados corretamente
    const formattedPhone = formatPhone(businessInfo.phone);
    const cleanInstagram = businessInfo.instagram ? cleanSocial(businessInfo.instagram) : '';
    const cleanFacebook = businessInfo.facebook ? cleanSocial(businessInfo.facebook) : '';
    
    // Montar texto exato que deve aparecer
    const cleanEmail = businessInfo.email ? businessInfo.email.replace(/@/g, ' at ') : '';
    
    const exactText = `
EMPRESA: ${businessInfo.companyName}

SERVIÇOS: ${cleanedDetails}

ENDEREÇO: ${businessInfo.addressStreet}, ${businessInfo.addressNumber} - ${businessInfo.addressNeighborhood}
CIDADE: ${businessInfo.addressCity}

CONTATO:
WhatsApp: ${formattedPhone}
${cleanEmail ? `Email: ${cleanEmail}` : ''}
${cleanInstagram ? `Instagram: ${cleanInstagram}` : ''}
${cleanFacebook ? `Facebook: ${cleanFacebook}` : ''}
${businessInfo.website ? `Site: ${businessInfo.website}` : ''}
    `.trim();
    
    // PROMPT OTIMIZADO
    const prompt = `
Generate a professional square advertising flyer (1:1 ratio) with EXACT Brazilian Portuguese text.

CRITICAL REQUIREMENTS:
1. DO NOT CREATE 3D MOCKUPS - create a flat design flyer ONLY
2. DO NOT MODIFY OR INVENT TEXT - use exactly the text provided below
3. ALL TEXT MUST BE IN BRAZILIAN PORTUGUESE (pt-BR)
4. Use clean, modern typography with high readability
5. Create clear visual hierarchy: Business name > Services > Contact info
6. Background must be SIMPLE and CLEAN (solid color or subtle gradient)
7. Include minimalist decorative elements related to ${niche} business
8. Ensure ALL text is clearly legible and properly aligned
9. Square format with content using 90% of space

EXACT TEXT TO INCLUDE (in Brazilian Portuguese):
${exactText}

DESIGN STYLE:
- Modern minimalist aesthetic
- Professional color scheme for ${niche} business
- High contrast for perfect text legibility
- Clean layout with proper spacing
- NO 3D elements or mockup effects
- NO complex backgrounds or scenes
- Text must be perfectly readable

The flyer should look professional, modern, and attractive for a ${niche} business in Brazil.
    `.trim();
    
    return prompt;
}

module.exports = {
    buildPrompt
};


module.exports = {
    buildPrompt,
    getStyleInstructions,
    getLayoutInstructions,
    formatContactInfo,
    NICHE_VISUAL_STYLES
};

// Teste standalone
if (require.main === module) {
    console.log('🧪 TESTE DO PROMPT BUILDER SERVICE\n');
    
    const testBusinessInfo = {
        companyName: 'Calors Automóveis',
        phone: '(11) 99999-9999',
        email: 'contato@calorsauto.com.br',
        instagram: '@calorsauto',
        facebook: '/calorsauto',
        website: 'www.calorsauto.com.br',
        addressStreet: 'Rua das Flores',
        addressNumber: '123',
        addressNeighborhood: 'Centro',
        addressCity: 'São Paulo',
        details: 'Oficina especializada em carros importados. Promoção de troca de óleo com desconto de 20%. Atendimento de segunda a sábado das 8h às 18h.',
        logo: ''
    };
    
    const testNiche = 'automotive_repair';
    const testStyle = { id: 'modern', name: 'Modern' };
    
    const prompt = buildPrompt(testBusinessInfo, testNiche, testStyle);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('PROMPT GERADO:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(prompt);
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`Tamanho do prompt: ${prompt.length} caracteres`);
    console.log('✅ TESTE CONCLUÍDO!');
}
