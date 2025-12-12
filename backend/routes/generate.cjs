const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo para geração de imagem
const imageModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Modelo para classificação (não será mais usado, mas deixei caso precise depois)
const classificationModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

router.post('/', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        // 🔥 Prompt final sem usar nicheContexts
        const finalPrompt = `
Crie uma imagem profissional em estilo flyer publicitário vertical.
Use SOMENTE português do Brasil.

TEXTO DO USUÁRIO:
${prompt}

REGRAS:
- NUNCA usar inglês ou espanhol na arte.
- Nunca inventar frases novas.
- O texto deve estar nítido, legível e correto em português.
- Evitar totalmente: texto distorcido, letras destruídas, números cortados,
  sombras irreais, baixa resolução, arte borrada, ruído, marcas d’água,
  elementos duplicados, escrita aleatória, símbolos estranhos,
  texto no fundo que interfira na leitura.
- A arte deve parecer um flyer comercial real, limpo, organizado e profissional.
- Deixe o texto sempre bem centralizado ou bem estruturado no layout.
- Sem bordas pesadas.
- Composição equilibrada, moderna e sem poluição visual.
        `;

        // 🔥 Chamada correta da API Gemini Flash para imagem
        const result = await imageModel.generateImage({
            prompt: finalPrompt,
            size: "1024x1024",
            n: 1
        });

        const base64 = result.response.candidates[0].content[0].text;

        return res.json({ base64 });

    } catch (err) {
        console.error("❌ Erro ao gerar imagem:", err);
        return res.status(500).json({
            error: "Erro ao gerar imagem",
            details: err.message
        });
    }
});

module.exports = router;
