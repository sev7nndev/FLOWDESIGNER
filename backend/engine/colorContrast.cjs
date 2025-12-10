// backend/engine/colorContrast.js
const colorContrast = {
    luminance: (hex) => {
        // Standard WCAG luminance calculation
        const rgb = hex.replace('#', '').match(/.{1,2}/g).map(h => parseInt(h, 16) / 255)
            .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    },
    ratio: (c1, c2) => {
        const L1 = colorContrast.luminance(c1) + 0.05;
        const L2 = colorContrast.luminance(c2) + 0.05;
        return (Math.max(L1, L2) / Math.min(L1, L2));
    },
    pickTextOnBackground: (bgAvgHex) => {
        // Checks if background is Dark (luminance < 0.4 approx)
        // If Dark: White Text + Gold Secondary
        // If Light: Dark Text + Blue/Slate Secondary
        const darkBg = colorContrast.luminance(bgAvgHex) < 0.4;

        if (darkBg) {
            return {
                primary: '#FFFFFF',
                secondary: '#FFD700',
                shadow: '3px 3px 8px rgba(0,0,0,0.9)'
            };
        }
        return {
            primary: '#1A1A1A',
            secondary: '#2C3E50',
            shadow: '3px 3px 8px rgba(255,255,255,0.9)'
        };
    }
};

module.exports = colorContrast;
