const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { generateImageWithQuotaCheck } = require('../services/generationService');

// Generate image endpoint
router.post('/generate', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { promptInfo } = req.body;

  if (!promptInfo) {
    return res.status(400).json({ error: 'O promptInfo é obrigatório.' });
  }

  try {
    const generatedImage = await generateImageWithQuotaCheck(userId, promptInfo);
    res.status(201).json(generatedImage);
  } catch (error) {
    console.error("Image generation error:", error);
    
    if (error.code === 'QUOTA_EXCEEDED') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Ocorreu um erro inesperado ao gerar a imagem.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get support recipient endpoint
router.get('/support-recipient', authenticateToken, async (req, res) => {
  try {
    // Find an admin or dev user to be the support recipient
    const { supabaseService } = require('../config');
    
    const { data: supportUser, error } = await supabaseService
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'dev'])
      .limit(1)
      .single();

    if (error || !supportUser) {
      // If no admin/dev found, use an owner as fallback
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