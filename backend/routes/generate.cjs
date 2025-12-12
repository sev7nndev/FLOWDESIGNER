const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const imageModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

router.post('/', async (req, res) => {
    try {
        const body = req.body;

        // 🔥 Aceita 3 formatos diferentes do frontend
        const prompt =
              body.prompt ||
              body.briefing ||
              body.details ||
              body.promptInfo?.briefing ||
              body.promptInfo?.details ||
              body.promptInfo?.pedido ||
              null;

        if (!prompt) {
            console.log("❌ Body recebido:", body);
            return res.status(400).json({
                error: "Prompt não encontrado. O frontend não enviou nenhum campo de texto."
            });
        }

        const finalPrompt = `
Crie uma imagem profissional no estilo flyer comercial vertical.
Texto fornecido pelo usuário (use exatamente como está, SEM INVENTAR):
"${prompt}"

REGRAS:
- Escreva SOMENTE em português do Brasil.
- Não use inglês, espanhol ou palavras aleatórias.
- Texto nítido, sem distorções, sem borrões, sem cortes.
- Nada de letras quebradas, números cortados ou sombras artificiais.
- Não gerar nenhum texto de fundo.
- Layout moderno, limpo, bem organizado e profissional.
- Centralizar ou estruturar bem o texto.
- Evitar poluição visual, ruído, manchas ou artefatos.
- Sem bordas ou molduras escuras.
        `;

        const result = await imageModel.generateImage({
            prompt: finalPrompt,
            size: "1024x1024",
            n: 1
        });

        const base64 = result.response.candidates?.[0]?.content?.[0]?.text;

        if (!base64) {
            throw new Error("Gemini não retornou imagem.");
        }

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
