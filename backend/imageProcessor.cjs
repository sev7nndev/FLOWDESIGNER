const { Jimp } = require('jimp');

// Helper to sanitize text (redundancy check)
function cleanText(text) {
    if (!text) return "";
    return text.toString().trim();
}

/**
 * Superimposes professional text onto the generated image.
 * This acts as the "Second AI" the user requested to handle text.
 */
async function processImagePayload(base64Image, data) {
    try {
        console.log("🎨 Engine: Starting Hybrid Text Overlay...");
        console.log("   - Data Received:", JSON.stringify(data));

        // 1. Load the image
        console.log("   - Jimp: Reading Image Buffer...");
        let image;
        try {
            image = await Jimp.read(Buffer.from(base64Image, 'base64'));
        } catch (imgReadError) {
            console.error("   ❌ Jimp Read Failed. Buffer might be invalid.", imgReadError);
            return base64Image;
        }

        const width = image.bitmap.width;
        const height = image.bitmap.height;
        console.log(`   - Jimp: Image Loaded (${width}x${height})`);

        // 2. Load Fonts (Jimp Standard Fonts)
        console.log("   - Jimp: Loading Fonts...");
        let fontTitleBig, fontTitleShadow, fontBody, fontSmall, fontTitleMed;
        try {
            fontTitleBig = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
            fontTitleShadow = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
            fontTitleMed = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            fontBody = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
            console.log("   - Jimp: Fonts Loaded Successfully");
        } catch (fontErr) {
            console.error("   ❌ Jimp Font Load Error:", fontErr);
            throw fontErr;
        }

        // --- LAYER 1: MAIN TITLE (Company Name) ---
        if (data.companyName) {
            console.log(`   - Jimp: Drawing Title "${data.companyName}"`);
            const title = cleanText(data.companyName).toUpperCase();
            const textWidth = Jimp.measureText(fontTitleBig, title);
            const textX = (width / 2) - (textWidth / 2); // Center align
            const textY = height * 0.15; // Top 15%

            // Shadow
            image.print(fontTitleShadow, textX + 3, textY + 3, title);
            // Main Text
            image.print(fontTitleBig, textX, textY, title);
        } else {
            console.warn("   ⚠️ Jimp: No Company Name provided for Title");
        }

        // --- LAYER 2: FOOTER (Contact Info) ---
        console.log("   - Jimp: Drawing Footer...");
        // Define Footer Dimensions (Bottom 28%)
        const footerHeight = Math.floor(height * 0.28);
        const footerY = height - footerHeight;

        // Create the "Glass" Overlay
        const footer = new Jimp(width, footerHeight, '#000000');
        footer.opacity(0.85); // 85% opacity dark background (almost solid)

        image.composite(footer, 0, footerY);

        // Layout Logic (Padding & spacing)
        const padding = 40;
        let currentY = footerY + padding;

        // --- LINE 1: WHATSAPP (Highlight) ---
        if (data.whatsapp) {
            const whatsappText = `WhatsApp: ${cleanText(data.whatsapp)}`;
            image.print(fontTitleBig, padding, currentY, whatsappText, width - (padding * 2));
            currentY += 70; // Spacing for 64px font
        }

        // --- LINE 2: ADDRESS ---
        if (data.endereco) {
            let addressText = cleanText(data.endereco);
            if (data.numero) addressText += `, ${data.numero}`;
            if (data.bairro) addressText += ` - ${data.bairro}`;

            image.print(fontBody, padding, currentY, addressText, width - (padding * 2));
            currentY += 40;
        }

        // --- LINE 3: CITY ---
        if (data.cidade) {
            image.print(fontBody, padding, currentY, cleanText(data.cidade), width - (padding * 2));
            currentY += 40;
        }

        // --- LINE 4: EXTRA INFO (Website/Instagram) ---
        let extraInfo = [];
        if (data.site) extraInfo.push(data.site);
        if (data.instagram) extraInfo.push(data.instagram);

        if (extraInfo.length > 0) {
            currentY += 10;
            image.print(fontSmall, padding, currentY, extraInfo.join('  |  '), width - (padding * 2));
        }

        // 6. Return Processed Image
        const processedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
        console.log("✅ Engine: Text Overlay Applied Successfully.");
        return processedBuffer.toString('base64');

    } catch (error) {
        console.error("⚠️ Image Processing Failed:", error);
        return base64Image; // Fallback to original image if Jimp fails
    }
}

module.exports = { processImagePayload };
