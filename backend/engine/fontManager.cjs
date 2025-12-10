// backend/engine/fontManager.js
// Maps aesthetic styles to font families.
// NOTE: For Jimp implementation, we map these to standard bitmap sizes/colors.
// In a full Canvas implementation, these would map to loaded .ttf files.

const fontManager = {
    pickTitleFont: (styleHint) => {
        switch (styleHint) {
            case 'industrial': return { family: 'Bebas Neue', weight: 800 };
            case 'elegant': return { family: 'Oswald Bold', weight: 800 };
            case 'friendly': return { family: 'Poppins Bold', weight: 800 };
            default: return { family: 'Montserrat Black', weight: 900 };
        }
    },
    pickSubtitleFont: () => ({ family: 'Open Sans', weight: 600 }),
    pickBodyFont: () => ({ family: 'Inter', weight: 400 }),
    pickContactFont: () => ({ family: 'Inter Medium', weight: 700 }),

    // Validation helper
    isPremium: (family) => [
        'Montserrat Black', 'Montserrat Bold', 'Poppins Bold', 'Bebas Neue', 'Oswald Bold', 'Raleway Bold',
        'Open Sans', 'Lato', 'Roboto', 'Inter', 'Inter Medium', 'Source Sans Pro', 'Nunito'
    ].includes(family)
};

module.exports = fontManager;
