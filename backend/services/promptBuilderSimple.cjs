/**
 * PROMPT BUILDER SIMPLIFICADO
 * Foco em texto exato sem markdown
 */

/**
 * Limpa texto removendo TODOS os caracteres markdown
 */
function ultraCleanText(text) {
    return text
        .replace(/\*\*/g, '')          // Remove bold
        .replace(/\*/g, '')            // Remove italic
        .replace(/#{1,6}\s/g, '')      // Remove headers
        .replace(/---/g, '')           // Remove horizontal rules
        .replace(/\[.*?\]/g, '')       // Remove links
        .replace(/[\[\]\(\)\{\}]/g, ' ') // Remove brackets
        .replace(/[#\-\*\>\|\`]/g, ' ') // Remove markdown chars
        .replace(/\s+/g, ' ')          // Normaliza espaços
        .trim();
}

/**
 * Formata telefone brasileiro
 */
function formatPhone(phone) {
    const numbers = phone.replace(/\D/g, '');
    
    if (numbers.length === 11) {
        return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
    } else if (numbers.length === 10) {
        return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
    }
    
    return phone;
}

/**
 * Constrói prompt simples e direto
 */
function buildSimplePrompt(businessInfo, niche) {
    // Limpar TUDO
    const cleanDetails = ultraCleanText(businessInfo.details).substring(0, 150);
    const cleanName = ultraCleanText(businessInfo.companyName);
    
    // Formatar contatos
    const phone = formatPhone(businessInfo.phone);
    const email = businessInfo.email ? businessInfo.email.replace(/@/g, ' at ') : '';
    const instagram = businessInfo.instagram ? businessInfo.instagram.replace(/[@/]/g, '') : '';
    const facebook = businessInfo.facebook ? businessInfo.facebook.replace(/[@/]/g, '') : '';
    
    // Texto entre aspas (cada linha)
    const lines = [
        `"${cleanName}"`,
        `"${cleanDetails}"`,
        `"${businessInfo.addressStreet}, ${businessInfo.addressNumber} - ${businessInfo.addressNeighborhood}"`,
        `"${businessInfo.addressCity}"`,
        `"WhatsApp: ${phone}"`,
    ];
    
    if (email) lines.push(`"Email: ${email}"`);
    if (instagram) lines.push(`"Instagram: ${instagram}"`);
    if (facebook) lines.push(`"Facebook: ${facebook}"`);
    if (businessInfo.website) lines.push(`"Site: ${businessInfo.website}"`);
    
    const exactText = lines.join(' | ');
    
    // Prompt minimalista
    const prompt = `
Professional advertising flyer for Brazilian business. Square format 1:1.

CRITICAL: DO NOT INVENT TEXT. DO NOT MODIFY TEXT. USE EXACTLY AS PROVIDED.

TEXT TO DISPLAY (COPY EXACTLY):
${exactText}

DESIGN:
- Flat 2D design (NO 3D mockups)
- Clean modern layout
- Professional colors for ${niche}
- High text legibility
- Simple background

Brazilian Portuguese. Professional quality.
    `.trim();
    
    return prompt;
}

module.exports = {
    buildSimplePrompt,
    ultraCleanText,
    formatPhone
};
