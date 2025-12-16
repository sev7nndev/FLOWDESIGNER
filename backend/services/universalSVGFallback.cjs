/**
 * UNIVERSAL SVG FALLBACK GENERATOR
 * Gera flyers SVG profissionais com texto 100% preciso
 */

const { getUniversalTemplate } = require('./universalTemplates.cjs');

function escapeXML(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatPhoneSimple(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    }
    if (digits.length === 10) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    }
    return digits;
}

async function generateUniversalSVG(businessData, niche) {
    const template = getUniversalTemplate(niche);
    const decorativeElement = template.elements[Math.floor(Math.random() * template.elements.length)];
    
    // Truncar descrição para caber bem
    const shortDesc = businessData.details.substring(0, 120);
    
    const svg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradiente de fundo moderno -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${template.colors.primary}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${template.colors.secondary}" stop-opacity="0.05"/>
    </linearGradient>
    
    <!-- Gradiente para header -->
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${template.colors.primary}"/>
      <stop offset="100%" stop-color="${template.colors.secondary}"/>
    </linearGradient>
    
    <!-- Sombra suave -->
    <filter id="softShadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Sombra para texto -->
    <filter id="textShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.2"/>
    </filter>
  </defs>
  
  <!-- Background com gradiente -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  <!-- Card principal com sombra -->
  <g filter="url(#softShadow)">
    <rect x="40" y="40" width="944" height="944" rx="24" fill="white"/>
  </g>
  
  <!-- Header com gradiente -->
  <rect x="40" y="40" width="944" height="180" rx="24" fill="url(#headerGradient)"/>
  <rect x="40" y="160" width="944" height="60" fill="url(#headerGradient)" opacity="0.3"/>
  
  <!-- Elemento decorativo grande -->
  <text x="512" y="140" text-anchor="middle" font-family="Arial" font-size="80" fill="white" opacity="0.9">
    ${decorativeElement}
  </text>
  
  <!-- Nome da empresa (header) -->
  <text x="512" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="white" filter="url(#textShadow)">
    ${escapeXML(businessData.companyName.toUpperCase())}
  </text>
  
  <!-- Descrição -->
  <text x="512" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="${template.colors.text}" font-weight="500">
    <tspan x="512" dy="0">${escapeXML(shortDesc.substring(0, 60))}</tspan>
    ${shortDesc.length > 60 ? `<tspan x="512" dy="32">${escapeXML(shortDesc.substring(60, 120))}</tspan>` : ''}
  </text>
  
  <!-- Linha divisória elegante -->
  <line x1="120" y1="380" x2="904" y2="380" stroke="${template.colors.secondary}" stroke-width="2" opacity="0.3"/>
  
  <!-- Seção de Endereço -->
  <g transform="translate(512, 450)">
    <!-- Ícone de localização -->
    <circle cx="0" cy="-20" r="32" fill="${template.colors.primary}" opacity="0.1"/>
    <text y="-10" text-anchor="middle" font-size="28">📍</text>
    
    <!-- Título -->
    <text y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${template.colors.primary}">
      ENDEREÇO
    </text>
    
    <!-- Endereço linha 1 -->
    <text y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="${template.colors.text}">
      ${escapeXML(businessData.addressStreet)}, ${businessData.addressNumber}
    </text>
    
    <!-- Endereço linha 2 -->
    <text y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="${template.colors.text}">
      ${escapeXML(businessData.addressNeighborhood)} - ${escapeXML(businessData.addressCity)}
    </text>
  </g>
  
  <!-- Linha divisória -->
  <line x1="120" y1="580" x2="904" y2="580" stroke="${template.colors.secondary}" stroke-width="2" opacity="0.3"/>
  
  <!-- Seção de Contato -->
  <g transform="translate(512, 650)">
    <!-- Ícone de contato -->
    <circle cx="0" cy="-20" r="32" fill="${template.colors.secondary}" opacity="0.1"/>
    <text y="-10" text-anchor="middle" font-size="28">📱</text>
    
    <!-- Título -->
    <text y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${template.colors.primary}">
      CONTATO
    </text>
    
    <!-- WhatsApp -->
    <text y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="600" fill="${template.colors.secondary}">
      WhatsApp: ${formatPhoneSimple(businessData.phone)}
    </text>
    
    <!-- Email -->
    ${businessData.email ? `
    <text y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="${template.colors.text}">
      📧 ${escapeXML(businessData.email)}
    </text>
    ` : ''}
    
    <!-- Redes sociais -->
    ${businessData.instagram || businessData.facebook ? `
    <text y="130" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="${template.colors.text}">
      ${businessData.instagram ? `📸 ${escapeXML(businessData.instagram.replace('@', ''))}` : ''}
      ${businessData.instagram && businessData.facebook ? ' • ' : ''}
      ${businessData.facebook ? `👍 ${escapeXML(businessData.facebook.replace('/', ''))}` : ''}
    </text>
    ` : ''}
  </g>
  
  <!-- Footer moderno -->
  <rect x="40" y="920" width="944" height="64" rx="0 0 24 24" fill="${template.colors.primary}" opacity="0.05"/>
  <text x="512" y="960" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${template.colors.text}" opacity="0.6">
    Flyer Profissional • ${niche.toUpperCase()} • Gerado por FLOW
  </text>
</svg>
    `.trim();

    return {
        success: true,
        image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
        niche: niche,
        accuracy: 100,
        source: 'svg_professional',
        isFallback: true
    };
}

module.exports = {
    generateUniversalSVG
};
