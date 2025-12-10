const Jimp = require("jimp");
const path = require('path');
const fs = require('fs');

// TEMPLATE ENGINE - Sistema de Templates Profissionais
class TemplateEngine {
    constructor() {
        this.templatesPath = path.join(__dirname, '../templates');
    }

    // Detecta o nicho do negócio
    detectNiche(businessData) {
        const text = ((businessData.companyName || '') + ' ' + (businessData.details || '')).toLowerCase();

        if (text.match(/mecanica|carro|auto|oficina|motor|suspensao|embreagem/)) return 'mecanica';
        if (text.match(/despachante|detran|emplacamento|transferencia|veiculo|licenciamento/)) return 'despachante';
        if (text.match(/manutencao|predial|banheira|spa|hidro|encanamento/)) return 'manutencao';
        if (text.match(/bar|restaurante|churrasco|bebida|heineken|cerveja|jogo|futebol/)) return 'bar_restaurante';
        if (text.match(/festa|evento|carnaval|show|balada|aniversario|esquenta/)) return 'festa_evento';

        return 'mecanica'; // Default
    }

    // Renderiza template com dados do cliente
    async renderTemplate(businessData) {
        try {
            console.log("🎨 [TEMPLATE ENGINE] Iniciando renderização...");

            // 1. Detectar nicho
            const niche = this.detectNiche(businessData);
            console.log(`📁 [TEMPLATE ENGINE] Nicho detectado: ${niche}`);

            // 2. Carregar configuração do template
            const templateDir = path.join(this.templatesPath, niche);
            const configPath = path.join(templateDir, 'config.json');
            const imagePath = path.join(templateDir, 'template.png');

            // Verificar se template existe
            if (!fs.existsSync(imagePath)) {
                console.log(`⚠️ [TEMPLATE ENGINE] Template não encontrado para ${niche}, usando fallback`);
                return null; // Fallback para sistema antigo
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log(`✅ [TEMPLATE ENGINE] Template carregado: ${config.name}`);

            // 3. Carregar imagem base
            const img = await Jimp.Jimp.read(imagePath);
            const w = img.bitmap.width;
            const h = img.bitmap.height;
            console.log(`📐 [TEMPLATE ENGINE] Dimensões: ${w}x${h}px`);

            // 4. Carregar fontes
            console.log("🔤 [TEMPLATE ENGINE] Carregando fontes...");
            const fonts = await this.loadFonts();

            // 5. Renderizar cada camada de texto
            console.log("📝 [TEMPLATE ENGINE] Renderizando textos...");

            // Company Name
            if (config.textLayers.companyName && businessData.companyName) {
                await this.renderText(
                    img,
                    businessData.companyName,
                    config.textLayers.companyName,
                    fonts
                );
                console.log(`   ✅ Nome: "${businessData.companyName}"`);
            }

            // Tagline/Details
            if (config.textLayers.tagline && businessData.details) {
                await this.renderText(
                    img,
                    businessData.details,
                    config.textLayers.tagline,
                    fonts
                );
                console.log(`   ✅ Tagline: "${businessData.details}"`);
            }

            // Phone
            if (config.textLayers.phone && businessData.phone) {
                await this.renderText(
                    img,
                    `📱 ${businessData.phone}`,
                    config.textLayers.phone,
                    fonts
                );
                console.log(`   ✅ Telefone: "${businessData.phone}"`);
            }

            // Instagram
            if (config.textLayers.instagram && businessData.instagram) {
                const insta = businessData.instagram.replace('@', '');
                await this.renderText(
                    img,
                    `📷 @${insta}`,
                    config.textLayers.instagram,
                    fonts
                );
                console.log(`   ✅ Instagram: "@${insta}"`);
            }

            // Address
            if (config.textLayers.address) {
                const address = this.formatAddress(businessData);
                if (address) {
                    await this.renderText(
                        img,
                        `📍 ${address}`,
                        config.textLayers.address,
                        fonts
                    );
                    console.log(`   ✅ Endereço: "${address}"`);
                }
            }

            // 6. Converter para base64
            console.log("💾 [TEMPLATE ENGINE] Convertendo para base64...");
            const buffer = await img.getBuffer('image/png');
            const base64 = buffer.toString('base64');

            console.log("✅ [TEMPLATE ENGINE] Renderização completa!");
            return base64;

        } catch (error) {
            console.error("❌ [TEMPLATE ENGINE] Erro:", error.message);
            return null; // Fallback para sistema antigo
        }
    }

    // Renderiza um texto na imagem
    async renderText(img, text, config, fonts) {
        const font = fonts[config.fontPath] || fonts.FONT_SANS_32_BLACK;

        // Calcular largura do texto
        const textWidth = Jimp.measureText(font, text);

        // Calcular posição X baseado no alinhamento
        let x = config.x;
        if (config.align === 'center') {
            x = config.x - (textWidth / 2);
        }

        // Renderizar sombra se configurado
        if (config.shadow) {
            img.print({
                font: font,
                x: x + 2,
                y: config.y + 2,
                text: text
            });
        }

        // Renderizar texto principal
        img.print({
            font: font,
            x: x,
            y: config.y,
            text: text
        });
    }

    // Carrega todas as fontes necessárias (Jimp v1.x - usar caminhos diretos)
    async loadFonts() {
        console.log("   Loading fonts with direct paths...");
        const fontBasePath = path.join(__dirname, '../../node_modules/@jimp/plugin-print/dist/fonts/open-sans');

        return {
            FONT_SANS_64_BLACK: await Jimp.loadFont(path.join(fontBasePath, 'open-sans-64-black/open-sans-64-black.fnt')),
            FONT_SANS_32_BLACK: await Jimp.loadFont(path.join(fontBasePath, 'open-sans-32-black/open-sans-32-black.fnt')),
            FONT_SANS_16_BLACK: await Jimp.loadFont(path.join(fontBasePath, 'open-sans-16-black/open-sans-16-black.fnt'))
        };
    }

    // Formata endereço completo
    formatAddress(data) {
        let addr = '';
        if (data.addressStreet) {
            addr += data.addressStreet;
            if (data.addressNumber) addr += `, ${data.addressNumber}`;
            if (data.addressNeighborhood) addr += ` - ${data.addressNeighborhood}`;
        }
        if (data.addressCity) {
            addr += addr ? ` - ${data.addressCity}` : data.addressCity;
        }
        return addr;
    }
}

module.exports = { TemplateEngine };
