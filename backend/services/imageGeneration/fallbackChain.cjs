const axios = require('axios');
const { detectNicheIntelligent, generateProfessionalPrompt } = require('./promptEngine.cjs');
const { validateTextQuality } = require('./textValidator.cjs');
const NICHE_PROMPTS = require('./nicheContexts.cjs');

// --- API CLIENTS ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;


/**
 * GENERATOR 1: Google Imagen 4 Ultra
 */
async function generateWithImagen4(prompt) {
    console.log('🎨 [Gen 1] Attempting Imagen 4 Ultra...');
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`,
            {
                instances: [{ 
                    prompt: prompt, 
                    aspectRatio: "9:16",
                    guidanceScale: 8.5 // Optimized for Ultra detail
                }],
                parameters: { 
                    sampleCount: 1, 
                    outputOptions: { mimeType: "image/png" } 
                }
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 80000 }
        );

        const b64 = response.data?.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) throw new Error("No image data from Imagen.");
        return b64;
    } catch (e) {
        throw new Error(`Imagen Ultra Error: ${e.message}`);
    }
}

/**
 * GENERATOR 2: Freepik Flux (via API)
 */
async function generateWithFreepik(prompt) {
    console.log('🎨 [Gen 2] Attempting Freepik Flux...');
    if (!FREEPIK_API_KEY) throw new Error("Freepik Key missing");

    try {
        const response = await axios.post(
            "https://api.freepik.com/v1/ai/text-to-image",
            {
                prompt: prompt,
                image: { size: "portrait_16_9" },
                styling: { 
                    style: "digital-art", // Changed to 'digital-art' for clean advertising/flyer look
                    items: { check_nswf: true } 
                },
                // Requesting high quality logic
                guidance_scale: 4.5 // Higher guidance to enforce "Flyer/Ad" structure
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-freepik-api-key': FREEPIK_API_KEY,
                    'Accept': 'application/json'
                },
                timeout: 120000
            }
        );

        // Handle Base64 or URL
        if (response.data?.data?.[0]?.base64) return response.data.data[0].base64;
        if (response.data?.data?.[0]?.url) {
            const imgRes = await axios.get(response.data.data[0].url, { responseType: 'arraybuffer' });
            return Buffer.from(imgRes.data, 'binary').toString('base64');
        }
        throw new Error("Freepik returned no valid image data");
    } catch (e) {
        throw new Error(`Freepik Error: ${e.message}`);
    }
}

/**
 * MAIN ORCHESTRATOR
 */
async function generate(businessData) {
    console.log('🔁 [FallbackChain] Starting Intelligent Generation...');

    // 1. Intelligence Phase
    const niche = await detectNicheIntelligent(businessData);
    
    let customContext = null;
    if (niche === 'dynamic_creative') {
        const { generateDynamicNicheContext } = require('./promptEngine.cjs');
        customContext = await generateDynamicNicheContext(businessData);
    }
    
    let prompt = await generateProfessionalPrompt(businessData, niche, customContext);
    
    console.log(`🎯 [Target] Niche: ${niche} | Prompt Length: ${prompt.length}`);

    // 2. Execution Chain
    const attempts = [
        { name: 'Imagen 4 Ultra', fn: () => generateWithImagen4(prompt) },
        { name: 'Freepik Flux', fn: () => generateWithFreepik(prompt) }
    ];

    let lastError = null;
    let bestEffortResult = null;

    for (const attempt of attempts) {
        try {
            // A. Generate
            const imageBase64 = await attempt.fn();
            
            // Capture this as a potential fallback even if validation fails
            bestEffortResult = { 
                imageBase64, 
                prompt, 
                method: attempt.name, 
                niche,
                quality: 'low_confidence'
            };

            // B. Validate
            console.log(`🕵️ [Validator] Checking ${attempt.name} result...`); 
            const validation = await validateTextQuality(imageBase64, businessData);
            
            if (validation.isValid) {
                console.log(`✅ [Success] Generated valid image with ${attempt.name}`);
                return { 
                    ...bestEffortResult,
                    quality: 'high_confidence',
                    validation: validation.details
                };
            } else {
                console.warn(`⚠️ [Quality] ${attempt.name} produced bad text. Score: ${validation.details?.legibilityScore}`);
            }

        } catch (e) {
            console.warn(`❌ [Failure] ${attempt.name} crashed: ${e.message}`);
            lastError = e;
        }
    }

    if (bestEffortResult) {
        console.warn("⚠️ [Fallback] All methods failed validation. Returning best available result.");
        return bestEffortResult;
    }

    throw new Error(`All generation methods failed. Last error: ${lastError?.message}`);
}

module.exports = { generate };
