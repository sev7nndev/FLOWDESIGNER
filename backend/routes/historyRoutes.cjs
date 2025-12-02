// backend/routes/historyRoutes.cjs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth'); // Reutilizando middleware de autenticação
const { supabaseAnon } = require('../config'); // Helper para obter URL pública

const getPublicUrl = (bucketName, path) => {
  const { data: { publicUrl } } = supabaseAnon.storage
    .from(bucketName)
    .getPublicUrl(path);
  return publicUrl;
};

// Endpoint para buscar o histórico de imagens do usuário autenticado
router.get('/', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;

  try {
    // RLS na tabela 'images' garante que o usuário só veja as suas próprias imagens,
    // mas usamos o service role key no backend para garantir que a query funcione.
    // No entanto, para obter a URL pública, usamos o supabaseAnon.
    const { data, error } = await supabaseAnon
      .from('images')
      .select('id, prompt, business_info, created_at, image_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user history:", error);
      throw new Error(error.message);
    }

    // Mapeia para o formato GeneratedImage e adiciona a URL pública
    const historyWithUrls = data.map((row) => ({
      id: row.id,
      url: getPublicUrl('generated-arts', row.image_url),
      prompt: row.prompt,
      businessInfo: row.business_info,
      createdAt: new Date(row.created_at).getTime(),
    }));

    res.json(historyWithUrls);
  } catch (error) {
    next(error);
  }
});

module.exports = router;