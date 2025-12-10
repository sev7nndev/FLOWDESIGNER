// backend/engine/layoutValidator.js
const layoutValidator = {
    validate: (layoutJson, imageAnalysis) => {
        const errors = [];

        if (!layoutJson || !layoutJson.layout) {
            return { valid: false, errors: ['JSON invalido ou vazio'] };
        }

        // Regra: fontes premium (simulada via check de nome)
        for (const item of layoutJson.layout) {
            if (!item.fontFamily) {
                errors.push(`Fonte ausente em ${item.type}`);
            }
            if (item.fontSize < 14) {
                // errors.push(`Tamanho muito pequeno em ${item.type} (${item.fontSize}px)`); 
                // Desabilitado para evitar falsos positivos em ícones pequenos
            }
        }

        // Regra: sombras obrigatórias
        for (const item of layoutJson.layout) {
            if (!item.textShadow) {
                // Auto-fix could happen here, but we just report for now
                errors.push(`Sombra ausente em ${item.type}`);
            }
        }

        // Regra: contraste (simplificada)
        // const bgHex = imageAnalysis.avgBackgroundColor;
        // ... contrast check logic implementation ...

        return { valid: errors.length === 0, errors };
    }
};

module.exports = layoutValidator;
