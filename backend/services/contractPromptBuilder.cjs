/**
 * CONTRACT PROMPT BUILDER
 * Cria prompt TEXT-LOCK para Freepik Mystic
 * Blocos curtos estruturados previnem pseudo-texto visual
 */

function sanitizeForFreepik(text) {
    if (!text) return '';
    return text
        .replace(/@/g, '')
        .replace(/\$/g, '')
        .replace(/\#/g, '')
        .replace(/\%/g, '')
        .replace(/\&/g, 'e')
        .trim();
}

function buildContractPrompt(normalizedData, textBlocks, niche) {
    // Sanitizar dados
    const safeData = {
        companyName: sanitizeForFreepik(normalizedData.companyName),
        fullAddress: sanitizeForFreepik(normalizedData.fullAddress),
        phone: sanitizeForFreepik(normalizedData.phone),
        email: sanitizeForFreepik(normalizedData.email),
        instagram: sanitizeForFreepik(normalizedData.instagram),
        facebook: sanitizeForFreepik(normalizedData.facebook),
        website: sanitizeForFreepik(normalizedData.website)
    };
    
    // Mapa de nichos
    const nicheNames = {
        'food': 'alimentação e restaurantes',
        'beauty': 'beleza e estética',
        'fitness': 'academia e fitness',
        'professional': 'serviços profissionais',
        'retail': 'varejo e comércio',
        'technology': 'tecnologia',
        'education': 'educação',
        'automotive': 'oficina mecânica automotiva',
        'construction': 'construção e reformas',
        'events': 'eventos e festas',
        'pet': 'pet shop e veterinária',
        'home': 'serviços residenciais',
        'fashion': 'moda',
        'art': 'arte e cultura',
        'health': 'saúde e bem-estar',
        'transport': 'transporte e logística'
    };
    
    const nicheName = nicheNames[niche] || 'serviços profissionais';
    
    // Blocos de texto (se for objeto) ou texto simples (se for string)
    const titulo = typeof textBlocks === 'object' ? textBlocks.titulo : safeData.companyName;
    const subtitulo = typeof textBlocks === 'object' ? textBlocks.subtitulo : textBlocks;
    const destaque = typeof textBlocks === 'object' ? textBlocks.destaque : '';
    
    const prompt = `
Crie um flyer publicitário profissional para redes sociais.

Idioma: português do Brasil.
NÃO use outro idioma.

Inclua APENAS os seguintes blocos de texto,
sem alterar letras ou palavras.

Bloco 1 – Título curto:
"${sanitizeForFreepik(titulo)}"

Bloco 2 – Subtítulo:
"${sanitizeForFreepik(subtitulo)}"

${destaque ? `Bloco 3 – Destaque:\n"${sanitizeForFreepik(destaque)}"` : ''}

Bloco 4 – Contato:
"WhatsApp: ${safeData.phone}"
${safeData.email ? `"Email: ${safeData.email}"` : ''}

Bloco 5 – Endereço:
"${safeData.fullAddress}"

${safeData.instagram || safeData.facebook || safeData.website ? `Bloco 6 – Redes sociais:` : ''}
${safeData.instagram ? `"Instagram: ${safeData.instagram}"` : ''}
${safeData.facebook ? `"Facebook: ${safeData.facebook}"` : ''}
${safeData.website ? `"Site: ${safeData.website}"` : ''}

Regras obrigatórias:
- NÃO inventar palavras
- NÃO estilizar letras de forma artística
- Usar tipografia simples e legível
- NÃO simular escrita manual
- NÃO criar textos adicionais

Estilo visual:
- Nicho: ${nicheName}
- Fotografia realista de produto
- Design brasileiro contemporâneo
- Flyer publicitário para redes sociais
- Layout profissional nível agência

O resultado deve parecer um flyer criado por um designer profissional brasileiro.
    `.trim();
    
    return prompt;
}

module.exports = {
    buildContractPrompt
};
