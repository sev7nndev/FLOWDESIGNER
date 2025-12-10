// backend/engine/renderer.cjs
const { Jimp, loadFont, measureText } = require('jimp'); // Destructure loadFont and measureText
const path = require('path');

// Helper to resolve font path in node_modules
const getFontPath = (name) => {
    // Path: node_modules/@jimp/plugin-print/fonts/open-sans/name/name.fnt
    return path.resolve(__dirname, '../../node_modules/@jimp/plugin-print/fonts/open-sans', name, `${name}.fnt`);
};

async function renderTextOnImage(base64Image, layoutResult) {
    try {
        console.log("🎨 Renderer: Starting Professional Render (Jimp)...");
        const image = await Jimp.read(Buffer.from(base64Image, 'base64'));
        const width = image.bitmap.width;
        const height = image.bitmap.height;

        // Load Fonts (Standard & Bold)
        // Note: For strokes in Jimp, we usually fail or simulate it by printing multiple times.
        // A better approach for "Pro" styling in Backend is using SVG/sharp, but staying with Jimp as requested.
        const fonts = {
            's64': await loadFont(getFontPath('open-sans-64-white')),
            's32': await loadFont(getFontPath('open-sans-32-white')),
            's16': await loadFont(getFontPath('open-sans-16-white')),
            's64b': await loadFont(getFontPath('open-sans-64-black')),
            's32b': await loadFont(getFontPath('open-sans-32-black'))
        };

        const getFont = (size, color) => {
            // Limited font selection in basic Jimp, ignoring family/color mapping for now
            // Logic to pick closest size
            if (size >= 50) return fonts.s64;
            if (size >= 28) return fonts.s32;
            return fonts.s16;
        };

        const getStrokeFont = (size) => {
            // Use black font for stroke simulation if main is white
            if (size >= 50) return fonts.s64b;
            if (size >= 28) return fonts.s32b;
            return fonts.s64b; // Fallback
        };

        for (const item of layoutResult.layout) {
            const x = (item.x / 100) * width;
            const y = (item.y / 100) * height;

            const font = getFont(item.fontSize, item.color);
            const textWidth = measureText(font, item.text);
            const textHeight = measureTextHeight(font, item.text, 1000); // 1000 max width

            // Alignment
            let printX = x;
            if (item.align === 'center') printX = x - (textWidth / 2);
            else if (item.align === 'right') printX = x - textWidth;

            let printY = y;

            // DRAW BACKGROUND BOX (If requested)
            if (item.backgroundColor) {
                // Parse Hex to Int? Jimp uses integer colors usually.
                // Simple box drawing manually via scan
                const pad = item.padding || 10;
                const bx = Math.floor(printX - pad);
                const by = Math.floor(printY - pad);
                const bw = Math.floor(textWidth + (pad * 2));
                const bh = Math.floor(textHeight + (pad * 2));

                // Robust Box Drawing
                if (bx >= 0 && by >= 0 && bx + bw < width && by + bh < height) {
                    image.scan(bx, by, bw, bh, function (lx, ly, idx) {
                        // Set color (Green/Black etc). Hardcoded Alpha-blend for now
                        // e.g., Black semi-transparent
                        if (item.backgroundColor.includes('#000') || item.backgroundColor === 'rgba(0,0,0,0.8)') {
                            this.bitmap.data[idx] = 0x00;
                            this.bitmap.data[idx + 1] = 0x00;
                            this.bitmap.data[idx + 2] = 0x00;
                            this.bitmap.data[idx + 3] = 0xCC; // Alpha
                        } else if (item.backgroundColor.includes('#25D366')) { // Whatsapp
                            this.bitmap.data[idx] = 0x25;
                            this.bitmap.data[idx + 1] = 0xD3;
                            this.bitmap.data[idx + 2] = 0x66;
                            this.bitmap.data[idx + 3] = 0xFF; // Full opacity
                        }
                    });
                }
            }

            // SIMULATE STROKE (Outline)
            if (item.strokeColor) {
                // Print 4 times offset
                const strokeFont = getStrokeFont(item.fontSize);
                const off = Math.max(2, (item.strokeWidth || 2));
                image.print(strokeFont, printX - off, printY, item.text);
                image.print(strokeFont, printX + off, printY, item.text);
                image.print(strokeFont, printX, printY - off, item.text);
                image.print(strokeFont, printX, printY + off, item.text);
            }

            // MAIN TEXT
            image.print(font, Math.floor(printX), Math.floor(printY), item.text);
        }

        const processedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
        return processedBuffer.toString('base64');

    } catch (e) {
        console.error("❌ Renderer Failed:", e);
        return base64Image;
    }
}

// Helper for height (Jimp measureText only gives width)
function measureTextHeight(font, text, maxWidth) {
    return Jimp.measureTextHeight(font, text, maxWidth);
}

module.exports = { renderTextOnImage };
