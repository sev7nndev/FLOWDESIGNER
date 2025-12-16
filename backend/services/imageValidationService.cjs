/**
 * IMAGE VALIDATION SERVICE
 * 
 * Usa Gemini Vision para validar se o texto gerado está correto
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Valida se a imagem contém o texto esperado
 * 
 * @param {string} base64Image - Imagem em base64
 * @param {object} expectedData - Dados que devem aparecer na imagem
 * @returns {Promise<{isValid: boolean, errors: string[]}>}
 */
async function validateImageText(base64Image, expectedData) {
    console.log('🔍 Validando texto da imagem com Gemini Vision...');
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        // Converter base64 para formato que Gemini aceita
        const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');
        
        const prompt = `
Analyze this advertising flyer image and verify if ALL the following text appears EXACTLY as written:

COMPANY NAME: ${expectedData.companyName}
PHONE: ${expectedData.phone}
ADDRESS: ${expectedData.addressStreet}, ${expectedData.addressNumber}, ${expectedData.addressNeighborhood}, ${expectedData.addressCity}
${expectedData.email ? `EMAIL: ${expectedData.email}` : ''}
${expectedData.instagram ? `INSTAGRAM: ${expectedData.instagram}` : ''}
${expectedData.website ? `WEBSITE: ${expectedData.website}` : ''}

Check for:
1. Is the company name visible and spelled correctly?
2. Is the phone number visible and formatted correctly?
3. Is the address visible and complete?
4. Are all contact details visible?
5. Is there any gibberish or invented text?

Respond in JSON format:
{
    "isValid": true/false,
    "errors": ["list of errors found"],
    "missingInfo": ["list of missing information"]
}
        `.trim();
        
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageData,
                    mimeType: "image/png"
                }
            }
        ]);
        
        const response = result.response.text();
        
        // Extrair JSON da resposta
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('⚠️ Gemini não retornou JSON válido');
            return {
                isValid: false,
                errors: ['Não foi possível validar a imagem']
            };
        }
        
        const validation = JSON.parse(jsonMatch[0]);
        
        if (validation.isValid) {
            console.log('✅ Imagem validada com sucesso!');
        } else {
            console.log('❌ Imagem com erros:', validation.errors);
        }
        
        return validation;
        
    } catch (error) {
        console.error('❌ Erro ao validar imagem:', error.message);
        // Em caso de erro, retornar como inválido
        return {
            isValid: false,
            errors: ['Erro ao validar: ' + error.message]
        };
    }
}

module.exports = {
    validateImageText
};
