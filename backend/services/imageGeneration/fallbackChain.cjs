const axios = require('axios');
const { detectNicheIntelligent, generateProfessionalPrompt, condensePrompt } = require('./promptEngine.cjs');
const { validateTextQuality } = require('./textValidator.cjs');
const NICHE_PROMPTS = require('./nicheContexts.cjs');

// --- API CLIENTS ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;


/**
 * GENERATOR 1: Google Imagen 4 Ultra
 */
async function generateWithImagen4(prompt) {
    console.log('🎨 [Gen 1] Attempting Imagen 4 Ultra (2K)...');
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`,
            {
               instances: [{
    prompt: `
${prompt}

CRITICAL FORMAT REQUIREMENTS:
- This is a FLAT 2D DIGITAL GRAPHIC for social media (Instagram/Facebook post)
- NOT a photo of a flyer, NOT a billboard, NOT a sign, NOT a mockup
- NO physical context (no streets, walls, rooms, outdoor scenes)
- Pure digital design - professional advertising poster style

LANGUAGE REQUIREMENTS:
- ALL TEXT MUST BE IN PERFECT BRAZILIAN PORTUGUESE
- NO Spanish, NO English, NO mixed languages, NO spelling errors
- Proper grammar, proper accents (á, ã, ç, é, etc.)
- NO invented words, NO random letters, NO gibberish

QUALITY REQUIREMENTS:
- Professional social media advertising quality
- Clean, modern, impactful layout
- Large, legible, well-formatted text
- Consistent color palette and branding
`,
    aspectRatio: "3:4",
    guidanceScale: 7.0
}],

                parameters: { 
                    sampleCount: 1, 
                    // Explicitly requesting 2K resolution
                    imageSize: "2K",
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
 * GENERATOR 2: Freepik Mystic (via API)
 */
async function generateWithFreepik(prompt) {
    console.log('🎨 [Gen 2] Attempting Freepik Mystic (2K)...');
    if (!FREEPIK_API_KEY) throw new Error("Freepik Key missing");

    try {

// ...
        // SIMPLIFIED PROMPT FOR MYSTIC (Smart Condensation)
        // Mystic fails with very long prompts. Truncating/Condensing to 800 for safety.
        // If prompt is too long, we use Gemini to rewrite it densely (preserving details) instead of blind truncation.
        let safePrompt = prompt;
        if (safePrompt.length > 1000) {
            safePrompt = await condensePrompt(safePrompt);
        }
        const flyerPrompt = `Flat 2D digital social media graphic. NOT a person holding sign. NOT mockup. ${safePrompt}`;

        // SPLIT POSITIVE AND NEGATIVE PROMPTS
        // promptEngine returns "Negative Prompt: ..." at the end. We must separate it.
        let finalPositive = flyerPrompt;
        let finalNegative = "billboard, outdoor, signpost, sign, mockup, photo of flyer, physical flyer, 3D scene, street, wall, frame, display, wheat field, road, environment, room, shop, desk, perspective, camera, lens, photorealistic scene, person holding flyer, hand holding paper, hands, person, people, human, holding sign, physical context, building, sidewalk, pavement, concrete, brick wall, wood surface, table, blurry, amateur, distorted, watermark, text about text"; // Strong anti-mockup safety

        const negMatch = flyerPrompt.match(/Negative Prompt:\s*(.*)/i);
        if (negMatch) {
            finalNegative = negMatch[1].trim();
            finalPositive = flyerPrompt.replace(negMatch[0], "").trim();
        }

        // 1. INITIATE TASK
        const initResponse = await axios.post(
            "https://api.freepik.com/v1/ai/mystic",
            {
                prompt: finalPositive,
                negative_prompt: finalNegative,
                model: "super_real",
                aspect_ratio: "traditional_3_4",
                resolution: "2k",
                guidance_scale: 3.5, // Balanced: strong adherence without causing failures
                filter_nsfw: true
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-freepik-api-key': FREEPIK_API_KEY,
                    'Accept': 'application/json'
                },
                timeout: 30000
            }
        );

        const taskId = initResponse.data?.data?.task_id;
        if (!taskId) throw new Error("Freepik returned no task_id");

        console.log(`⏳ [Freepik] Task Initiated: ${taskId}`);

        // 2. POLL FOR COMPLETION
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        let attempts = 0;
        const maxAttempts = 45; // ~90 seconds max
        let imageUrl = null;

        while (attempts < maxAttempts) {
            attempts++;
            await sleep(2000); 

            try {
                const pollResponse = await axios.get(
                    `https://api.freepik.com/v1/ai/mystic/${taskId}`,
                    {
                        headers: {
                            'x-freepik-api-key': FREEPIK_API_KEY,
                            'Accept': 'application/json'
                        },
                        timeout: 10000
                    }
                );
                
                const status = pollResponse.data?.data?.status;
                process.stdout.write(`.`); 

                if (status === 'COMPLETED') {
                     imageUrl = pollResponse.data?.data?.generated?.[0];
                     console.log(" ✅");
                     break;
                } else if (status === 'FAILED') {
                     console.log(" ❌");
                     const failureDetails = JSON.stringify(pollResponse.data, null, 2);
                     console.error("Freepik Failure Details:", failureDetails);
                     throw new Error(`Freepik Task Status: FAILED - ${failureDetails}`);
                }
            } catch (pollErr) {
                console.warn(`[Freepik] Poll error: ${pollErr.message}`);
                if (pollErr.message.includes("FAILED")) throw pollErr;
            }
        }

        if (!imageUrl) throw new Error("Freepik generation timed out or failed to return URL");

        // 3. DOWNLOAD & CONVERT
        console.log(`⬇️ [Freepik] Downloading result from ${imageUrl}...`);
        const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        return Buffer.from(imgRes.data, 'binary').toString('base64');

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
    prompt += `
IMPORTANT:
ALL TEXT MUST BE IN BRAZILIAN PORTUGUESE.
DO NOT USE ENGLISH. DO NOT USE SPANISH.
`
    

    // 2. Execution Chain
    const attempts = [
        { name: 'Imagen 4 Ultra', fn: () => generateWithImagen4(prompt) },
        { name: 'Freepik Mystic', fn: () => generateWithFreepik(prompt) }
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