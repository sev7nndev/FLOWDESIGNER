const Jimp = require("jimp");
const path = require('path');

// RENDERER V3 - PROFESSIONAL VERSION (NO WHITE PANEL)
// Jimp v1.6.0 - Text directly on artwork with shadows

async function renderV3(base64Image, layout) {
    try {
        console.log("🎨 [RENDERER V3] === INICIANDO (SEM PAINEL BRANCO) ===");

        // 1. CARREGAR IMAGEM
        console.log("📥 [RENDERER V3] Carregando imagem base...");
        const buffer = Buffer.from(base64Image, "base64");
        const img = await Jimp.Jimp.read(buffer);
        const w = img.bitmap.width;
        const h = img.bitmap.height;
        console.log(`✅ [RENDERER V3] Imagem carregada: ${w}x${h}px`);

        // 2. CARREGAR FONTES
        console.log("🔤 [RENDERER V3] Carregando fontes...");
        const fontBasePath = path.join(__dirname, '../../node_modules/@jimp/plugin-print/dist/fonts/open-sans');
        const fontBig = await Jimp.loadFont(path.join(fontBasePath, 'open-sans-64-black/open-sans-64-black.fnt'));
        const fontMid = await Jimp.loadFont(path.join(fontBasePath, 'open-sans-32-black/open-sans-32-black.fnt'));
        const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
        const fontWhiteMid = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        console.log("✅ [RENDERER V3] Fontes carregadas!");

        // 3. CRIAR CAMADA DE SOMBRA SEMI-TRANSPARENTE NO BOTTOM (para legibilidade)
        console.log("🌑 [RENDERER V3] Criando overlay de sombra para legibilidade...");
        const overlayHeight = Math.floor(h * 0.35); // 35% da altura
        const overlay = new Jimp.Jimp({ width: w, height: overlayHeight, color: 0x000000AA });

        // Aplicar gradiente de transparência (mais escuro embaixo, transparente em cima)
        overlay.scan(0, 0, w, overlayHeight, function (x, y, idx) {
            const alpha = Math.floor((y / overlayHeight) * 180); // 0 no topo, 180 embaixo
            this.bitmap.data[idx + 3] = alpha;
        });

        img.composite(overlay, 0, h - overlayHeight);
        console.log("✅ [RENDERER V3] Overlay aplicado!");

        // 4. RENDERIZAR TEXTOS DIRETAMENTE NA ARTE (com sombras fortes)
        console.log("📝 [RENDERER V3] Renderizando textos na arte...");

        // Posição inicial: 70% da altura da imagem
        let cursor = Math.floor(h * 0.70);
        const shadowOffset = 3; // Offset da sombra

        // HEADLINE (Company Name)
        if (layout.text?.headline) {
            console.log(`📝 [RENDERER V3] Renderizando headline: "${layout.text.headline}"`);
            const tw = Jimp.measureText(fontWhite, layout.text.headline);
            const xPos = (w - tw) / 2;

            // Sombra (múltiplas camadas para efeito mais forte)
            for (let i = 0; i < 3; i++) {
                img.print({
                    font: fontBig,
                    x: xPos + shadowOffset + i,
                    y: cursor + shadowOffset + i,
                    text: layout.text.headline
                });
            }

            // Texto principal (branco)
            img.print({
                font: fontWhite,
                x: xPos,
                y: cursor,
                text: layout.text.headline
            });
            cursor += 80;
        }

        // SUBHEADLINE
        if (layout.text?.subheadline) {
            console.log(`📝 [RENDERER V3] Renderizando subheadline: "${layout.text.subheadline}"`);
            const tw = Jimp.measureText(fontWhiteMid, layout.text.subheadline);
            const xPos = (w - tw) / 2;

            // Sombra
            for (let i = 0; i < 2; i++) {
                img.print({
                    font: fontMid,
                    x: xPos + shadowOffset + i,
                    y: cursor + shadowOffset + i,
                    text: layout.text.subheadline
                });
            }

            // Texto principal
            img.print({
                font: fontWhiteMid,
                x: xPos,
                y: cursor,
                text: layout.text.subheadline
            });
            cursor += 50;
        }

        // CONTACTS (WhatsApp, Instagram, Address)
        if (layout.text?.contacts && Array.isArray(layout.text.contacts)) {
            console.log(`📞 [RENDERER V3] Renderizando ${layout.text.contacts.length} contatos...`);
            for (const contact of layout.text.contacts) {
                if (!contact) continue;
                const tw = Jimp.measureText(fontWhiteMid, contact);
                const xPos = (w - tw) / 2;

                // Sombra
                for (let i = 0; i < 2; i++) {
                    img.print({
                        font: fontMid,
                        x: xPos + shadowOffset + i,
                        y: cursor + shadowOffset + i,
                        text: contact
                    });
                }

                // Texto principal
                img.print({
                    font: fontWhiteMid,
                    x: xPos,
                    y: cursor,
                    text: contact
                });
                console.log(`   ✅ "${contact}"`);
                cursor += 45;
            }
        }

        // 5. CONVERTER PARA BASE64
        console.log("💾 [RENDERER V3] Convertendo para base64...");
        const finalBuffer = await img.getBuffer('image/png');
        const finalBase64 = finalBuffer.toString("base64");

        console.log("✅ [RENDERER V3] === CONCLUÍDO COM SUCESSO ===");
        console.log(`📊 [RENDERER V3] Tamanho final: ${finalBase64.length} bytes`);

        return finalBase64;

    } catch (error) {
        console.error("❌ [RENDERER V3] ERRO CRÍTICO:");
        console.error("   Tipo:", error.constructor.name);
        console.error("   Mensagem:", error.message);
        console.error("   Stack:", error.stack);
        throw error;
    }
}

module.exports = { renderV3 };
