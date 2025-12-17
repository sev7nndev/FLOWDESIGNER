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
    
    // Preparar serviços se existirem
    const servicesText = businessInfo.services && businessInfo.services.length > 0 
        ? businessInfo.services.join(' • ') 
        : '';
    
    // Preparar promoção se existir
    const promotionText = businessInfo.promotion || '';
    const priceText = businessInfo.price ? `R$ ${businessInfo.price}` : '';
    
    // PROMPT ULTRA-DETALHADO COM GRID LAYOUT PROFISSIONAL
    const prompt = `
Create a PROFESSIONAL VERTICAL ADVERTISING FLYER (3:4 aspect ratio, 1500x2000px) for a Brazilian business.

⚠️ CRITICAL LAYOUT RULES - FOLLOW EXACTLY:

═══════════════════════════════════════════════════════════════
📐 GRID STRUCTURE (MANDATORY):
═══════════════════════════════════════════════════════════════

The flyer MUST be divided into 3 CLEAR SECTIONS with proper spacing:

┌─────────────────────────────────────────┐
│  SECTION 1: HEADER (Top 25%)            │  ← Company name + logo
├─────────────────────────────────────────┤
│  SECTION 2: MAIN CONTENT (Middle 50%)   │  ← Visual + Services
├─────────────────────────────────────────┤
│  SECTION 3: FOOTER (Bottom 25%)         │  ← Contact info
└─────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
📋 SECTION 1 - HEADER (Top 25%):
═══════════════════════════════════════════════════════════════

- Background: Solid color or subtle gradient (${NICHE_VISUAL_STYLES[niche]?.colors[0] || 'professional blue'})
- Company Name: "${businessInfo.companyName}"
  * Font: Bold, modern, LARGE (72-96pt)
  * Position: Centered horizontally, vertically centered in this section
  * Color: High contrast with background
  * NO other text in this section

═══════════════════════════════════════════════════════════════
🎨 SECTION 2 - MAIN CONTENT (Middle 50%):
═══════════════════════════════════════════════════════════════

BACKGROUND:
- Style: ${NICHE_VISUAL_STYLES[niche]?.mood || 'professional and modern'}
- Elements: ${NICHE_VISUAL_STYLES[niche]?.elements.slice(0, 2).join(', ') || 'modern professional elements'}
- Quality: Photorealistic, high-quality, well-composed
- IMPORTANT: Background elements must NOT overlap with text areas

TEXT CONTENT (Left-aligned, clear hierarchy):

${servicesText ? `
🔹 SERVICES (if applicable):
"${servicesText}"
- Font: Medium weight, 36-48pt
- Position: Upper portion of this section
- Background: Semi-transparent overlay for readability
- Spacing: Generous padding around text
` : ''}

${promotionText ? `
🎁 PROMOTION:
"${promotionText}"
- Font: Bold, 42-54pt
- Position: Middle of this section
- Style: Eye-catching, highlighted box or badge
- Color: Accent color that stands out
` : ''}

${priceText ? `
💰 PRICE:
"${priceText}"
- Font: Extra bold, 60-72pt
- Position: Prominent, easy to spot
- Style: Price tag or badge design
` : ''}

${cleanedDetails ? `
📝 DESCRIPTION:
"${cleanedDetails}"
- Font: Regular weight, 28-36pt
- Position: Below services/promotion
- Max lines: 3-4 lines
- Readability: High contrast, clear background
` : ''}

═══════════════════════════════════════════════════════════════
📞 SECTION 3 - FOOTER (Bottom 25%):
═══════════════════════════════════════════════════════════════

BACKGROUND: Solid dark color or complementary to header

CONTACT INFORMATION (Well-organized, easy to read):

📍 ADDRESS:
"${businessInfo.addressStreet}, ${businessInfo.addressNumber}"
"${businessInfo.addressNeighborhood} - ${businessInfo.addressCity}"
- Font: Regular, 24-28pt
- Icon: Location pin
- Position: Top of footer section

📱 PHONE/WHATSAPP:
"${formattedPhone}"
- Font: Bold, 32-36pt
- Icon: Phone or WhatsApp
- Position: Below address
- Highlight: Make this stand out (it's primary contact)

${businessInfo.email ? `
📧 EMAIL:
"${businessInfo.email}"
- Font: Regular, 22-26pt
- Icon: Email envelope
- Position: Below phone
` : ''}

${cleanInstagram || cleanFacebook || businessInfo.website ? `
🌐 SOCIAL MEDIA (Horizontal row):
${cleanInstagram ? `• Instagram: @${cleanInstagram}` : ''}
${cleanFacebook ? `• Facebook: ${cleanFacebook}` : ''}
${businessInfo.website ? `• Site: ${businessInfo.website}` : ''}
- Font: Regular, 20-24pt
- Icons: Social media icons next to each
- Position: Bottom of footer
- Layout: Horizontal, evenly spaced
` : ''}

═══════════════════════════════════════════════════════════════
🎨 DESIGN REQUIREMENTS:
═══════════════════════════════════════════════════════════════

✅ DO:
- Use a professional color scheme for ${SUPPORTED_NICHES[niche] || niche} business
- Ensure ALL text is perfectly legible (high contrast)
- Use proper spacing and margins (minimum 40px padding on all sides)
- Create clear visual hierarchy (name > services > contact)
- Use icons to make contact info scannable
- Maintain consistent typography throughout
- Make the layout clean, organized, and professional
- Ensure background elements enhance, not distract from text

❌ DON'T:
- DO NOT create 3D mockups or physical flyer representations
- DO NOT overlap text with busy background areas
- DO NOT use more than 3 font families
- DO NOT make text smaller than 20pt
- DO NOT place important info near edges
- DO NOT use low-contrast color combinations
- DO NOT create cluttered or chaotic layouts
- DO NOT modify, translate, or invent any text content

═══════════════════════════════════════════════════════════════
🎯 FINAL QUALITY CHECKLIST:
═══════════════════════════════════════════════════════════════

Before finalizing, ensure:
✓ All text is in Brazilian Portuguese (pt-BR)
✓ Company name is the most prominent element
✓ Contact info is clearly visible and organized
✓ Layout follows the 3-section grid structure
✓ No text is cut off or outside the canvas
✓ Background doesn't interfere with text readability
✓ Design looks professional and print-ready
✓ All provided information is included and accurate

═══════════════════════════════════════════════════════════════

NICHE: ${SUPPORTED_NICHES[niche] || niche}
STYLE: ${selectedStyle?.name || 'Modern Professional'}
LANGUAGE: Brazilian Portuguese (pt-BR)
FORMAT: Vertical flyer, 3:4 ratio, ready for digital sharing and printing
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
