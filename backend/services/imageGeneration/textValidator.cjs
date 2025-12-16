const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retryWithBackoff } = require('../../utils/retryWithBackoff.cjs');

// Initialize Gemini for Vision
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


async function validateTextQuality(imageBase64, expectedData) {
    if (!imageBase64) return { isValid: false, reason: "No image data" };

    try {
        const prompt = `
ANALYZE THE TEXT IN THIS IMAGE FOR A BRAZILIAN BUSINESS.

EXPECTED INFORMATION:
- Business Name: "${expectedData.nome}"
- Phone: "${expectedData.whatsapp || expectedData.telefone}"

YOUR TASKS:
1. Extract the text visible in the image.
2. Check if the "Business Name" is readable and spelled correctly (ignore minor case/style diffs).
3. Check if the "Phone" number is present and readable.
4. Detect if there is any "gibberish" or fake text.
5. Check if the text is in Portuguese.

OUTPUT JSON ONLY:
{
    "detectedText": "string",
    "isPortuguese": boolean,
    "hasUseableName": boolean,
    "hasUseablePhone": boolean,
    "hasGibberish": boolean,
    "legibilityScore": number (0-10, where 10 is perfect),
    "finalVerdict": boolean (true if usable for client, false if major errors)
}
`;

        const result = await retryWithBackoff(
            async () => await visionModel.generateContent([
                prompt,
                { inlineData: { data: imageBase64, mimeType: "image/png" } }
            ]),
            {
                maxRetries: 3,
                initialDelayMs: 1000
            }
        );

        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleanJson);

        console.log(`🔍 [Text Validator] Verdict: ${analysis.finalVerdict} | Score: ${analysis.legibilityScore}`);
        return {
            isValid: analysis.legibilityScore >= 5, // Lowered threshold for initial rollout
            details: analysis
        };

    } catch (error) {
        console.error("⚠️ [Text Validator] Failed:", error.message);
        // Fail open or closed? If validator fails, we might assume image is OK to avoid blocking, 
        // OR assume bad to be safe. Let's assume OK with warning for now to prevent outage if Vision API flakes.
        return { isValid: true, reason: "Validator Error (Bypassed)" };
    }
}

module.exports = { validateTextQuality };
