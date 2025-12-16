/**
 * DATA NORMALIZER SERVICE
 * Normaliza todos os dados do formulário antes de enviar para qualquer IA
 */

function normalizeBusinessData(formData) {
    return {
        // Nome da empresa (limpo)
        companyName: cleanText(formData.companyName),
        
        // Telefone formatado
        phone: formatPhoneBR(formData.phone),
        
        // Email validado
        email: formData.email ? formData.email.trim().toLowerCase() : '',
        
        // Redes sociais limpas
        instagram: formData.instagram ? cleanSocial(formData.instagram) : '',
        facebook: formData.facebook ? cleanSocial(formData.facebook) : '',
        website: formData.website ? formData.website.trim() : '',
        
        // Endereço em linha única
        fullAddress: buildFullAddress(formData),
        
        // Briefing original (será corrigido pelo Gemini)
        briefing: formData.details || ''
    };
}

function formatPhoneBR(phone) {
    // Remove tudo exceto números
    const digits = phone.replace(/\D/g, '');
    
    // Formata (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (digits.length === 11) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    } else if (digits.length === 10) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    }
    
    // Retorna original se não conseguir formatar
    return phone;
}

function cleanSocial(social) {
    // Remove @, /, espaços e outros caracteres especiais
    return social
        .replace(/@/g, '')
        .replace(/\//g, '')
        .replace(/\s/g, '')
        .trim();
}

function buildFullAddress(formData) {
    const parts = [
        formData.addressStreet,
        formData.addressNumber,
        formData.addressNeighborhood,
        formData.addressCity
    ].filter(Boolean);
    
    return parts.join(', ');
}

function cleanText(text) {
    return text
        .trim()
        .replace(/\s+/g, ' ') // Normaliza espaços
        .replace(/[\r\n]+/g, ' '); // Remove quebras de linha
}

module.exports = {
    normalizeBusinessData
};
