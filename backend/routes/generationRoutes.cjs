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
    console.log('🎨 Starting image generation for user:', userId);
    const generatedImage = await generateImageWithQuotaCheck(userId, promptInfo);
    console.log('✅ Image generated successfully');
    res.status(201).json(generatedImage);
  } catch (error) {
    console.error("❌ Image generation error:", error);
    
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
    console.log('🔍 Fetching support recipient...');
    const { supabaseService } = require('../config');
    
    // Try to find admin or dev first
    const { data: supportUser, error } = await supabaseService
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'dev'])
      .limit(1)
      .single();

    if (error || !supportUser) {
      // If no admin/dev, try to find owner
      console.log('ℹ️  No admin/dev found, looking for owner...');
      const { data: ownerUser, error: ownerError } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('role', 'owner')
        .limit(1)
        .single();

      if (ownerError || !ownerUser) {
        console.error('❌ No support recipient found');
        return res.status(404).json({ error: 'Nenhum destinatário de suporte encontrado.' });
      }
      console.log('✅ Owner found as support recipient');
      return res.status(200).json({ recipientId: ownerUser.id });
    }
    
    console.log('✅ Admin/Dev found as support recipient');
    return res.status(200).json({ recipientId: supportUser.id });
  } catch (error) {
    console.error("❌ Error fetching support recipient:", error);
    res.status(500).json({ error: 'Erro ao buscar destinatário de suporte.' });
  }
});

module.exports = router;