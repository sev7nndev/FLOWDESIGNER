const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabaseService } = require('../config');

// Get user's image history
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const { data: images, error } = await supabaseService
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('History fetch error:', error);
      return res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }

    // Transform image URLs to public URLs
    const transformedImages = images.map(img => ({
      ...img,
      url: supabaseService.storage
        .from('generated-arts')
        .getPublicUrl(img.image_url).data.publicUrl
    }));

    res.status(200).json(transformedImages);
  } catch (error) {
    console.error('History endpoint error:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Delete specific image
router.delete('/:imageId', authenticateToken, async (req, res) => {
  const { imageId } = req.params;
  const userId = req.user.id;

  try {
    // Get image info first
    const { data: image, error: fetchError } = await supabaseService
      .from('images')
      .select('image_url')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !image) {
      return res.status(404).json({ error: 'Imagem não encontrada.' });
    }

    // Delete from storage
    const { error: storageError } = await supabaseService.storage
      .from('generated-arts')
      .remove([image.image_url]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabaseService
      .from('images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return res.status(500).json({ error: 'Erro ao excluir imagem.' });
    }

    res.status(200).json({ message: 'Imagem excluída com sucesso.' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;