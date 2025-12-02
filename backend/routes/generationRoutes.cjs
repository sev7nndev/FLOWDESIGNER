// backend/routes/generationRoutes.cjs
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateImageWithQuotaCheck } = require('../services/generationService');

router.post('/generate', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { promptInfo } = req.body;

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

// NOVO: Endpoint para buscar o destinatário de suporte
router.get('/support-recipient', authMiddleware, async (req, res) => {
  try {
    // Buscar um usuário com role 'admin' ou 'dev' para ser o destinatário do suporte
    const { data: supportUser, error } = await supabaseService
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'dev'])
      .limit(1)
      .single();

    if (error || !supportUser) {
      // Se não encontrar admin/dev, usar um usuário 'owner' como fallback
      const { data: ownerUser, error: ownerError } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('role', 'owner')
        .limit(1)
        .single();

      if (ownerError || !ownerUser) {
        return res.status(404).json({ error: 'Nenhum destinatário de suporte encontrado.' });
      }

      return res.status(200).json({ recipientId: ownerUser.id });
    }

    return res.status(200).json({ recipientId: supportUser.id });
  } catch (error) {
    console.error("Error fetching support recipient:", error);
    res.status(500).json({ error: 'Erro ao buscar destinatário de suporte.' });
  }
});

module.exports = router;