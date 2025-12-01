// ... (imports)

// Admin endpoint to delete a landing carousel image
router.delete('/landing-images/:id', authenticateToken, checkAdminOrDev, async (req, res, next) => {
  const { id } = req.params;
  // Remove imagePath from body, we will fetch it securely from the DB

  try {
    // 1. Fetch the image record to get the secure path
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