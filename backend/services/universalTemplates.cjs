/**
 * UNIVERSAL TEMPLATES
 * Templates visuais para cada nicho
 */

function getUniversalTemplate(niche) {
    const templates = {
        'food': {
            colors: { primary: '#E63946', secondary: '#F4A261', background: '#FFF3E0', text: '#5D4037' },
            elements: ['🍕', '🍔', '🥗', '🍝', '🥘', '🍣'],
            style: 'Apetitoso, vibrante, convidativo'
        },
        'beauty': {
            colors: { primary: '#FFAFCC', secondary: '#CDB4DB', background: '#FFE5EC', text: '#6D6875' },
            elements: ['💅', '💇', '💄', '🌸', '✨', '🦋'],
            style: 'Elegante, feminino, sofisticado'
        },
        'fitness': {
            colors: { primary: '#4CC9F0', secondary: '#4361EE', background: '#E3F2FD', text: '#1A237E' },
            elements: ['💪', '🏃', '🧘', '🏋️', '⚡', '🔥'],
            style: 'Energético, moderno, dinâmico'
        },
        'professional': {
            colors: { primary: '#303F9F', secondary: '#1976D2', background: '#E8EAF6', text: '#212121' },
            elements: ['💼', '📊', '📈', '🎯', '⭐', '🏆'],
            style: 'Profissional, clean, corporativo'
        },
        'retail': {
            colors: { primary: '#FF6B6B', secondary: '#FFD166', background: '#FFF9EC', text: '#5D4037' },
            elements: ['🛍️', '💰', '🎁', '🛒', '⭐', '🏷️'],
            style: 'Vibrante, atrativo, promocional'
        },
        'technology': {
            colors: { primary: '#7209B7', secondary: '#3A0CA3', background: '#F3E5F5', text: '#311B92' },
            elements: ['💻', '📱', '⚙️', '🔧', '🚀', '💡'],
            style: 'Moderno, tech, futurista'
        },
        'education': {
            colors: { primary: '#4CAF50', secondary: '#8BC34A', background: '#F1F8E9', text: '#33691E' },
            elements: ['📚', '🎓', '✏️', '🧠', '🌟', '🏫'],
            style: 'Educacional, inspirador, clean'
        },
        'automotive': {
            colors: { primary: '#FF9800', secondary: '#FF5722', background: '#FFF3E0', text: '#BF360C' },
            elements: ['🚗', '🔧', '⚙️', '🛠️', '⛽', '🚦'],
            style: 'Mecânico, robusto, confiável'
        },
        'construction': {
            colors: { primary: '#795548', secondary: '#8D6E63', background: '#EFEBE9', text: '#4E342E' },
            elements: ['🏗️', '🔨', '⚒️', '🧱', '📐', '🚧'],
            style: 'Robusto, confiável, sólido'
        },
        'events': {
            colors: { primary: '#9C27B0', secondary: '#E91E63', background: '#FCE4EC', text: '#6A1B9A' },
            elements: ['🎉', '🎈', '🎊', '🎁', '🥳', '✨'],
            style: 'Festivo, divertido, celebratório'
        },
        'pet': {
            colors: { primary: '#FF9800', secondary: '#8BC34A', background: '#FFF3E0', text: '#5D4037' },
            elements: ['🐕', '🐈', '🐾', '🥎', '🏠', '❤️'],
            style: 'Acolhedor, amigável, carinhoso'
        },
        'home': {
            colors: { primary: '#607D8B', secondary: '#90A4AE', background: '#ECEFF1', text: '#37474F' },
            elements: ['🏠', '🔑', '🛋️', '🪴', '🔧', '💡'],
            style: 'Confortável, acolhedor, residencial'
        },
        'fashion': {
            colors: { primary: '#E91E63', secondary: '#9C27B0', background: '#FCE4EC', text: '#880E4F' },
            elements: ['👗', '👠', '👜', '👒', '💎', '✨'],
            style: 'Elegante, moderno, fashion'
        },
        'art': {
            colors: { primary: '#FF4081', secondary: '#7B1FA2', background: '#F3E5F5', text: '#4A148C' },
            elements: ['🎨', '🖼️', '🎭', '🎵', '📷', '✨'],
            style: 'Criativo, expressivo, artístico'
        },
        'health': {
            colors: { primary: '#00BCD4', secondary: '#0097A7', background: '#E0F7FA', text: '#006064' },
            elements: ['💊', '❤️', '🏥', '🌿', '🧘', '⚕️'],
            style: 'Saúde, clean, confiável'
        },
        'transport': {
            colors: { primary: '#FF9800', secondary: '#2196F3', background: '#E3F2FD', text: '#0D47A1' },
            elements: ['🚚', '📦', '🚛', '⏱️', '📍', '🛣️'],
            style: 'Confiança, velocidade, eficiência'
        }
    };

    return templates[niche] || templates['professional'];
}

module.exports = {
    getUniversalTemplate
};
