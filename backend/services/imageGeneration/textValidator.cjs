const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class TextValidator {
    /**
     * Validates if the text in the image is legible and matches the intent
     * @param {string} imageBase64 - Base64 string of the image
     * @param {object} businessData - The data that should be in the image
     * @returns {Promise<{isValid: boolean, confidence: number, reason: string}>}
     */
    async validateImageText(imageBase64, businessData) {
        try {
            console.log('🧐 [Validator] Checking text legibility with Gemini Vision...');
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            
            const prompt = `Analyze this flyer image for text legibility and accuracy.
            
            Expected Text:
            - Business Name: "${businessData.nome}"
            - Phone: "${businessData.whatsapp || businessData.telefone}"
            
            Task:
            1. Can you clearly read the Business Name?
            2. Is the text well-formed (no gibberish/alien letters)?
            3. Are there any obvious spelling errors in the big text?
            
            Return JSON ONLY:
            {
                "legible": boolean,
                "text_found": "string (what text you actually see)",
                "score": number (0 to 10, where 10 is perfect),
                "has_spelling_errors": boolean
            }`;

            const imagePart = {
                inlineData: {
                    data: cleanBase64,
                    mimeType: "image/png"
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const responseText = result.response.text();
            
            // Parse JSON
            const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(jsonString);

            console.log('🧐 [Validator] Analysis Result:', analysis);

            // Decision Logic
            const isValid = analysis.legible && analysis.score >= 7;

            return {
                isValid,
                confidence: analysis.score,
                reason: isValid ? "Text is legible" : `Text validation failed: Found '${analysis.text_found}' (Score: ${analysis.score})`
            };

        } catch (error) {
            console.error('❌ [Validator] Error:', error);
            // Fail open? Or fail closed? For now, we warn but allow if validator crashes to avoid blocking service.
            // But user wants strict check. Let's return false usually, but true for network errors to be safe?
            // "The problem is fallback system fails silently". 
            // Better to return false so we trigger fallback if validation fails.
            return { isValid: false, confidence: 0, reason: "Validator Error" };
        }
    }
}

module.exports = new TextValidator();
