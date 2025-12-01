const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const router = express.Router();

// Inicializa o cliente Gemini com a chave de API do ambiente
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
        // Chama a API de geração de imagens do Gemini
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002', // Modelo de geração de imagem
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1', // Quadrado
            },
        });

        // A resposta contém um array de imagens. Pegamos a primeira.
        const base64Image = response.generatedImages[0].image.imageBytes;
        
        // Retorna a imagem em formato base64 para o frontend
        res.json({ image: base64Image });

    } catch (error) {
        console.error('Erro ao gerar imagem com Gemini:', error);
        res.status(500).json({ error: 'Falha ao gerar a imagem. Verifique a chave da API e o prompt.' });
    }
});

module.exports = router;