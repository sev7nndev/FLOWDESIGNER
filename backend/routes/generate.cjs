const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// MODELO: gemini-2.0-flash — suporta imagens via generateContent
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

router.post('/', async (req, res) => {
    try {
        const body = req.body;

        // Aceita vários formatos de campos (para funcionar com seu frontend atual)
        const prompt =
            body.prompt ||
            body.briefing ||
            body.details ||
            body.descricao ||
            body.texto ||
            body.promptInfo?.briefing ||
            body.promptInfo?.details ||
            body.promptInfo?.pedido ||
            null;

        if (!prompt) {
            console.log("❌ Body recebido:", body);
            return res.status(400).json({
                error: "Nenhum texto encontrado para gerar a imagem."
            });
        }

        const finalPrompt = `
Você é um gerador de artes comerciais.
Crie UMA imagem no formato quadrado (1024x1024) bem nítida, profissional e sem texto distorcido.

INSTRUÇÕES RÍGIDAS:
- Todo texto deve ser EXATAMENTE em português do Brasil.
- NÃO invente palavras.
- NÃO gere letras quebradas.
- NÃO deixe números cortados.
- NÃO coloque textos duplicados.
- NÃO coloque textos fantasma no fundo.
- NÃO gere bordas escuras ou molduras.

Texto fornecido pelo usuário (usar exatamente como está):
"${prompt}"

Gere APENAS a imagem, sem descrição.
`;

        // GEMINI 2.0 — gerar imagem usando generateContent
        const result = await model.generateContent([
            {
                text: finalPrompt
            }
        ]);

        const image = result.response.candidates?.[0]?.content?.find(
            c => c.type === "inline_data"
        );

        if (!image) {
            throw new Error("Gemini não retornou imagem base64.");
        }

        const base64 = image.inline_data.data;

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