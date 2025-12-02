const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Corrigido o import
const router = express.Router();

// Inicializa o cliente Gemini com a chave de API do ambiente
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Inicialização correta

/**
 * Rota para gerar uma imagem a partir de um prompt de texto.
 * O modelo Gemini 2.5 Flash é usado para geração de imagens.
 */
router.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'O prompt de texto é obrigatório.' });
  }

  try {
    // Obtém o modelo de geração de imagem
    const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

    // Chama a API de geração de imagens do Gemini
    const result = await model.generateContent([
      {
        text: prompt,
      }
    ]);

    // A resposta contém um array de imagens. Pegamos a primeira.
    const base64Image = result.response.candidates[0].content.parts[0].inlineData.data;

    // Retorna a imagem em formato base64 para o frontend
    res.json({ image: base64Image });
  } catch (error) {
    console.error('Erro ao gerar imagem com Gemini:', error);
    res.status(500).json({ error: 'Falha ao gerar a imagem. Verifique a chave da API e o prompt.' });
  }
});

module.exports = router;