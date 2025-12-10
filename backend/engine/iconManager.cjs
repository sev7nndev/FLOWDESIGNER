// backend/engine/iconManager.js
const iconManager = {
    colors: {
        whatsapp: '#25D366',
        instagram: ['#E4405F', '#C13584', '#F77737'], // Gradient definition
        facebook: '#1877F2',
        email: '#4A90E2',
        endereco: '#FF6B6B',
        site: '#3498DB'
    },

    sizeForFont: (fontPx) => Math.round(fontPx * 1.2),

    // Returns SVG string for renderer (if renderer supports SVG)
    // For Jimp renderer, these might need to be rasterized or swapped for PNGs
    svgWhatsapp: (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#25D366"><circle cx="12" cy="12" r="12"/></svg>`
};

module.exports = iconManager;
