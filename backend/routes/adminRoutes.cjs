const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkAdminOrDev } = require('../middleware/checkAdminOrDev');
const { supabaseService } = require('../config');

// Get all generated images (admin only)
router.get('/images', authenticateToken, checkAdminOrDev, async (req, res) => {
  try {
    const { data: images, error } = await supabaseService
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all images for admin:', error);
      throw new Error(error.message);
    }

    // Transform image URLs to public URLs
    const transformedImages = images.map(img => ({
      ...img,
      url: supabaseService.storage
        .from('generated-arts')
        .getPublicUrl(img.image_url).data.publicUrl
    }));

    res.json({ images: transformedImages });
  } catch (error) {
    console.error('Admin images error:', error);
    res.status(500).json({ error: 'Erro ao buscar imagens.' });
  }
});

// Delete specific image (admin only)
router.delete('/images/:id', authenticateToken, checkAdminOrDev, async (req, res) => {
  const { id } = req.params;
  const { imagePath } = req.body;

  if (!imagePath) {
    return res.status(400).json({ error: "Caminho da imagem é obrigatório para exclusão do storage." });
  }

  try {
    // Delete from Supabase Storage
    const { error: storageError } = await supabaseService.storage
      .from('generated-arts')
      .remove([imagePath]);

    if (storageError) {
      console.error(`Error deleting image from storage (${imagePath}):`, storageError);
    }

    // Delete from Supabase Database
    const { error: dbError } = await supabaseService
      .from('images')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error(`Error deleting image from DB (${id}):`, dbError);
      throw new Error(dbError.message);
    }

    res.json({ message: 'Imagem deletada com sucesso.' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Erro ao deletar imagem.' });
  }
});

module.exports = router;