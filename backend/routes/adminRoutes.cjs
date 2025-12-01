const express = require('express');
const router = express.Router();
const { supabaseService } = require('../config.cjs');
const { authenticateToken, protect } = require('../middleware/authMiddleware.cjs');

// --- Helper function to generate Signed URLs ---
const generateSignedUrl = async (path) => {
    // URL expira em 60 minutos (3600 segundos)
    const { data, error } = await supabaseService.storage
        .from('generated-arts')
        .createSignedUrl(path, 3600); 

    if (error) {
        console.error("Error generating signed URL:", error);
        return null;
    }
    return data.signedUrl;
};

// --- Rota 1: GET All Generated Images (Issue 4: Use Signed URLs) ---
router.get('/images', authenticateToken, protect(['admin', 'dev']), async (req, res, next) => {
    try {
        // 1. Fetch all image records from the 'images' table
        const { data: images, error: dbError } = await supabaseService
            .from('images')
            .select('id, created_at, prompt, image_url, business_info, user_id');

        if (dbError) throw dbError;

        // 2. Generate Signed URLs for each image
        const imagesWithSignedUrls = await Promise.all(images.map(async (img) => {
            const signedUrl = await generateSignedUrl(img.image_url);
            return {
                id: img.id,
                createdAt: img.created_at,
                prompt: img.prompt,
                businessInfo: img.business_info,
                userId: img.user_id,
                // CRITICAL FIX: Return the temporary signed URL instead of the static public URL
                url: signedUrl || 'URL_GENERATION_FAILED', 
            };
        }));

        res.json({ images: imagesWithSignedUrls });

    } catch (error) {
        console.error('Error fetching all generated images:', error);
        res.status(500).json({ error: 'Falha ao carregar todas as artes geradas.' });
    }
});


// --- Rota 2: DELETE Landing Carousel Image (Issue 3: Secure Deletion) ---
router.delete('/landing-images/:id', authenticateToken, protect(['admin', 'dev']), async (req, res, next) => {
  const { id } = req.params;

  try {
    // 1. CRITICAL FIX: Fetch the image record to get the secure path
    const { data: imageRecord, error: fetchError } = await supabaseService
        .from('landing_carousel_images')
        .select('image_url')
        .eq('id', id)
        .single();
        
    if (fetchError || !imageRecord) {
        return res.status(404).json({ error: "Registro de imagem não encontrado no banco de dados." });
    }
    
    const imagePath = imageRecord.image_url;

    // 2. Delete from Supabase Storage
    const { error: storageError } = await supabaseService.storage
      .from('landing-carousel')
      .remove([imagePath]);

    if (storageError) {
      console.error(`Error deleting landing image from storage (${imagePath}):`, storageError);
      // Continue to delete from DB even if storage fails, to keep DB consistent
    }

    // 3. Delete from Supabase Database
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