// backend/routes/generationRoutes.cjs
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware'); // Corrigido caminho
const { generateImageWithQuotaCheck } = require('../services/generationService');

router.post('/generate', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { promptInfo } = req.body; // Mudança: esperando promptInfo

  if (!promptInfo) {
    return res.status(400).json({ error: 'O promptInfo é obrigatório.' });
  }

  try {
    const generatedImage = await generateImageWithQuotaCheck(userId, promptInfo);
    res.status(201).json(generatedImage);
  } catch (error) {
    if (error.code === 'QUOTA_EXCEEDED') {
      return res.status(403).json({ error: error.message });
    }
    console.error("Image generation error:", error);
    res.status(500).json({ error: 'Ocorreu um erro inesperado ao gerar a imagem.' });
  }
});

module.exports = router;