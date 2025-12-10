const promptEngine = require('./promptEngine.cjs');
const textValidator = require('./textValidator.cjs');
const axios = require('axios');

// Import older generators if needed for fallback
// const experimentalGenerator = require('../../experimentalTextGenerator.cjs'); 
// We will try to self-contain the fallback logic here or reuse simpler calls.
// Since the report says "experimentalGenerator is critical", we might want to adapt its logic here 
// OR just use a simpler "generate without text + overlay" approach as fallback.
// For now, let's implement the main loop.

class FallbackChain {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
    }

    async generate(businessData) {
        const niche = await promptEngine.detectNiche(businessData);
        const prompt = promptEngine.generatePrompt(businessData, niche);
        
        console.log(`🔗 [Chain] Starting generation chain for ${businessData.nome} (${niche})`);

        // ATTEMPT 1: Imagen 4.0 High Quality
        try {
            console.log('🚀 [Chain] Attempt 1: Imagen 4.0 (Primary)');
            const image1 = await this.callImagen(prompt);
            
            // Validate
            const validation1 = await textValidator.validateImageText(image1, businessData);
            
            if (validation1.isValid) {
                console.log('✅ [Chain] Attempt 1 Success!');
                return { imageBase64: image1, prompt, method: 'imagen_4_0_primary' };
            } else {
                console.warn(`⚠️ [Chain] Attempt 1 Failed Validation: ${validation1.reason}`);
            }
        } catch (e) {
            console.error('❌ [Chain] Attempt 1 Error:', e.message);
        }

        // ATTEMPT 2: Imagen 4.0 Retry with simpler prompt or different seed?
        // Or maybe just try again? Sometimes it's random.
        try {
            console.log('🚀 [Chain] Attempt 2: Imagen 4.0 (Retry)');
            const image2 = await this.callImagen(prompt + " Ensure text is very large and clear.");
             const validation2 = await textValidator.validateImageText(image2, businessData);

            if (validation2.isValid) {
                 console.log('✅ [Chain] Attempt 2 Success!');
                return { imageBase64: image2, prompt, method: 'imagen_4_0_retry' };
            }
        } catch (e) {
             console.error('❌ [Chain] Attempt 2 Error:', e.message);
        }

        // ATTEMPT 3: FALLBACK (Could be Freepik if available, or just return the best we have?)
        // The report mentioned "Fallback System fails silently".
        // We should throw an error if all fail, OR return the "best effort".
        // For now, if all validation fails, we might just return the last image generated but mark it?
        // Or throw to let frontend handle?
        // Critical Report says: "Solução: Implement ... fallback".
        // Let's try to return the LAST successful generation even if validation failed, 
        // but maybe we can flag it? 
        // Actually, if it's illegible, it's garbage. 
        
        throw new Error("Unable to generate legible text after multiple attempts.");
    }

    async callImagen(prompt) {
         const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${this.apiKey}`, // Using 3.0 or 4.0 depending on availability. User code said 4.0.
            // Note: User code had `imagen-4.0-generate-001` in one place and `imagen-3.0` in another.
            // I'll stick to what seemed to work or use the one from `experimentalTextGenerator` which was 4.0
             {
                instances: [{ prompt, aspectRatio: "9:16" }],
                parameters: { sampleCount: 1, outputOptions: { mimeType: "image/png" } }
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data?.predictions?.[0]?.bytesBase64Encoded;
    }
}

module.exports = new FallbackChain();
