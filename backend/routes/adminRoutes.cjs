const express = require('express');
const router = express.Router();
const { authenticateToken, checkAdminOrDev } = require('../middleware/auth');
const { supabaseService, supabaseAnon } = require('../config');
const { v4: uuidv4 } = require('uuid');

// Helper para obter URL pública (usado para retornar o objeto GeneratedImage completo)
const getPublicUrl = (bucketName, path) => {
    const { data: { publicUrl } } = supabaseAnon.storage
        .from(bucketName)
        .getPublicUrl(path);
    return publicUrl;
};

// Admin endpoint to get all generated images
router.get('/images', authenticateToken, checkAdminOrDev, async (req, res, next) => {
  try {
    const { data, error } = await supabaseService
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching all images for admin:", error);
      throw new Error(error.message);
    }
    
    // Mapeia para o formato GeneratedImage e adiciona a URL pública
    const imagesWithUrls = data.map((row) => ({
        id: row.id,
        url: getPublicUrl('generated-arts', row.image_url),
        prompt: row.prompt,
        businessInfo: row.business_info,
        createdAt: new Date(row.created_at).getTime(),
    }));

    res.json({ images: imagesWithUrls });
  } catch (error) {
    next(error);
  }
});

// Admin endpoint to delete a generated image
router.delete('/images/:id', authenticateToken, checkAdminOrDev, async (req, res, next) => {
  const { id } = req.params;
  const { imagePath } = req.body; // This is the path in storage, e.g., "user-id/uuid.png"

  if (!imagePath) {
    return res.status(400).json({ error: "Caminho da imagem é obrigatório para exclusão do storage." });
  }

  try {
    // 1. Delete from Supabase Storage
    const { error: storageError } = await supabaseService.storage
      .from('generated-arts')
      .remove([imagePath]);

    if (storageError) {
      console.error(`Error deleting image from storage (${imagePath}):`, storageError);
      // Continue to delete from DB even if storage fails, to keep DB consistent
    }

    // 2. Delete from Supabase Database
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
    next(error);
  }
});

// Admin endpoint to upload a landing carousel image
router.post('/landing-images/upload', authenticateToken, checkAdminOrDev, async (req, res, next) => {
  const { fileBase64, fileName, userId } = req.body;
  const user = req.user;

  if (!fileBase64 || !fileName || !userId) {
    return res.status(400).json({ error: "Dados de arquivo incompletos." });
  }

  if (user.id !== userId) {
    return res.status(403).json({ error: "Ação não autorizada para o usuário especificado." });
  }

  try {
    const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Formato de base64 inválido.');
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    const MAX_LANDING_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (buffer.length > MAX_LANDING_IMAGE_SIZE_BYTES) {
        return res.status(400).json({ error: `O arquivo é muito grande. O tamanho máximo permitido é de ${MAX_LANDING_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.` });
    }

    const fileExtension = fileName.split('.').pop();
    const filePath = `landing-carousel/${userId}/${uuidv4()}.${fileExtension}`;

    // 1. Upload to Supabase Storage using service role key
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from('landing-carousel')
      .upload(filePath, buffer, {
        contentType: contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error(`Error uploading to Supabase Storage:`, uploadError);
      throw new Error(`Falha no upload para o armazenamento: ${uploadError.message}`);
    }

    // 2. Insert record into Supabase Database
    const { data: dbData, error: dbError } = await supabaseService
      .from('landing_carousel_images')
      .insert({ image_url: filePath, created_by: userId })
      .select('id, image_url, sort_order')
      .single();

    if (dbError || !dbData) {
      await supabaseService.storage.from('landing-carousel').remove([filePath]);
      console.error(`Error inserting into DB:`, dbError);
      throw new Error(`Falha ao registrar imagem no banco de dados: ${dbError?.message || 'Erro desconhecido'}`);
    }
    
    // Get public URL for the newly uploaded image
    const newLandingImage = {
        id: dbData.id,
        url: getPublicUrl('landing-carousel', dbData.image_url),
        sortOrder: dbData.sort_order
    };

    res.status(200).json({ message: 'Imagem da landing page carregada com sucesso!', image: newLandingImage });

  } catch (error) {
    next(error);
  }
});


// Admin endpoint to delete a landing carousel image
router.delete('/landing-images/:id', authenticateToken, checkAdminOrDev, async (req, res, next) => {
  const { id } = req.params;
  const { imagePath } = req.body;

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

    res.json({ message: 'Imagem da landing page deletada com sucesso.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;