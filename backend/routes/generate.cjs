const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const NICHE_PROMPTS = require('../services/nicheContexts.cjs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const imageModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const classificationModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

async function detectNiche(text) {
    const lower = (text || "").toLowerCase();

    for (const key of Object.keys(NICHE_PROMPTS)) {
        if (lower.includes(key.replace("_", " "))) return key;
    }

    try {
        const prompt = `Classify this business into one valid key: ${Object.keys(NICHE_PROMPTS).join(', ')}.
Text: ${text}.
Return ONLY the key.`;
        const completion = await classificationModel.generateContent(prompt);
        const result = completion.response.text().trim();
        return NICHE_PROMPTS[result] ? result : "profissional";
    } catch {
        return "profissional";
    }
}

router.post('/', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required." });

        const nicheKey = await detectNiche(prompt);
        const ctx = NICHE_PROMPTS[nicheKey] || NICHE_PROMPTS["profissional"];

        const negativeUniversal =
            "low quality, blur, distorted text, wrong language, bad anatomy, watermark, extra letters, duplicate text, random spanish, misspelled portuguese, cropped numbers, placeholder, mockup frame, UI elements, overlays, label";

        const finalPrompt =
            `Generate a professional advertising banner.
Business niche style: ${nicheKey}.
Scene: ${ctx.scene}.
Key elements: ${ctx.elements}.
Color palette: ${ctx.colors.join(", ")}.
Mood: ${ctx.mood}.
Typography: ${ctx.textStyle}.
Never use Spanish or English text inside the image unless explicitly requested.
Text on image (if needed): exactly as provided by user, correct Portuguese only.
Avoid: ${ctx.negative || ""}, ${negativeUniversal}.
Respect proportions. Center main object. No borders, no frames.`

        const result = await imageModel.generateImage({
            prompt: finalPrompt,
            size: "1024x1024",
            n: 1
        });

        const base64 = result.response.candidates[0].content[0].text;

        res.json({ base64 });

    } catch (err) {
        res.status(500).json({ error: "Erro ao gerar imagem.", details: err.message });
    }
});

module.exports = router;
