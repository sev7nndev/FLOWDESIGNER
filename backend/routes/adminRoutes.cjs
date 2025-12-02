const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkAdminOrDev } = require('../middleware/checkAdminOrDev');
const { supabaseService } = require('../config');

// Helper para obter URL pública
const getPublicUrl = (bucketName, path) => {
  const { data: { publicUrl } } = supabaseService.storage
    .from(bucketName)
    .getPublicUrl(path);
  return publicUrl;
};

// --- Generated Images Management ---

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

// --- Landing Carousel Management ---

// Upload new landing image (admin only)
router.post('/landing-images/upload', authenticateToken, checkAdminOrDev, async (req, res) => {
  const { fileBase64, fileName, userId } = req.body;
  
  if (!fileBase64 || !fileName) {
    return res.status(400).json({ error: "Dados de arquivo incompletos." });
  }
  
  try {
    // 1. Decode base64 and upload to storage
    const base64Data = fileBase64.split(';base64,').pop();
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const storagePath = `${Date.now()}-${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from('landing-carousel')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png', // Assuming PNG or JPEG, setting a default
        upsert: false
      });

    if (uploadError) {
      console.error('Landing image upload error:', uploadError);
      throw new Error('Falha ao salvar a imagem no storage.');
    }
    
    // 2. Get public URL
    const publicUrl = getPublicUrl('landing-carousel', storagePath);
    
    // 3. Insert record into database
    const { data: imageRecord, error: insertError } = await supabaseService
      .from('landing_carousel_images')
      .insert({
        image_url: storagePath,
        created_by: userId,
        sort_order: 0 // Default sort order
      })
      .select()
      .single();

    if (insertError) {
      console.error('Landing image DB insert error:', insertError);
      // Attempt to clean up storage if DB insert fails
      await supabaseService.storage.from('landing-carousel').remove([storagePath]);
      throw new Error('Falha ao registrar a imagem no banco de dados.');
    }
    
    // 4. Return the full object
    const newImage = {
      id: imageRecord.id,
      url: publicUrl,
      sortOrder: imageRecord.sort_order
    };

    res.status(201).json({ image: newImage });
  } catch (error) {
    console.error('Admin landing image upload endpoint error:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor ao fazer upload.' });
  }
});

// Delete specific landing image (admin only)
router.delete('/landing-images/:id', authenticateToken, checkAdminOrDev, async (req, res) => {
  const { id } = req.params;
  const { imagePath } = req.body; // This is the storage path (image_url column value)

  if (!imagePath) {
    return res.status(400).json({ error: "Caminho da imagem é obrigatório para exclusão do storage." });
  }

  try {
    // 1. Delete from Supabase Storage
    const { error: storageError } = await supabaseService.storage
      .from('landing-carousel')
      .remove([imagePath]);

    if (storageError) {
      console.error(`Error deleting landing image from storage (${imagePath}):`, storageError);
      // Continue even if storage fails, DB record is more critical
    }

    // 2. Delete from Supabase Database
    const { error: dbError } = await supabaseService
      .from('landing_carousel_images')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error(`Error deleting landing image from DB (${id}):`, dbError);
      throw new Error(dbError.message);
    }

    res.status(200).json({ message: 'Imagem da landing page deletada com sucesso.' });
  } catch (error) {
    console.error('Delete landing image error:', error);
    res.status(500).json({ error: 'Erro ao deletar imagem da landing page.' });
  }
});

module.exports = router;