/**
 * TEXT OVERLAY SERVICE
 * Adiciona texto preciso sobre backgrounds gerados por IA
 */

const Jimp = require('jimp');

async function addTextOverlay(base64Image, businessData, niche) {
    try {
        console.log('   📝 Iniciando overlay de texto...');
        
        // Converter base64 para buffer
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Carregar imagem
        const image = await Jimp.read(imageBuffer);
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        
        console.log(`   📐 Dimensões: ${width}x${height}`);
        
        // Criar overlay escuro semi-transparente
        const overlay = new Jimp(width, height, 0x00000099);
        image.composite(overlay, 0, 0);
        
        // Carregar fontes
        const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
        const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
        
        // NOME DA EMPRESA (topo)
        const companyName = businessData.companyName.toUpperCase();
        image.print(
            fontLarge,
            50,
            Math.floor(height * 0.1),
            {
                text: companyName,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            },
            width - 100
        );
        
        // DESCRIÇÃO
        const description = businessData.details.substring(0, 120);
        image.print(
            fontMedium,
            50,
            Math.floor(height * 0.3),
            {
                text: description,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            },
            width - 100
        );
        
        // WHATSAPP (destaque)
        const phone = formatPhone(businessData.phone);
        image.print(
            fontLarge,
            50,
            Math.floor(height * 0.7),
            {
                text: `WhatsApp: ${phone}`,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            },
            width - 100
        );
        
        // ENDEREÇO
        const address = `${businessData.addressStreet}, ${businessData.addressNumber} - ${businessData.addressNeighborhood}, ${businessData.addressCity}`;
        image.print(
            fontSmall,
            50,
            Math.floor(height * 0.85),
            {
                text: address,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            },
            width - 100
        );
        
        console.log('   ✅ Texto adicionado com sucesso!');
        
        // Converter para base64
        const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
        const finalBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        
        return {
            success: true,
            image: finalBase64
        };
        
    } catch (error) {
        console.error('   ❌ Erro no text overlay:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

function formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    }
    if (digits.length === 10) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    }
    return phone;
}

module.exports = {
    addTextOverlay
};
