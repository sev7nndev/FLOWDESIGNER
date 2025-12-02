// backend/routes/publicRoutes.cjs
const express = require('express');
const router = express.Router();
const { supabaseAnon } = require('../config');

// Helper para obter URL pública
const getPublicUrl = (bucketName, path) => {
  const { data: { publicUrl } } = supabaseAnon.storage
    .from(bucketName)
    .getPublicUrl(path);
  return publicUrl;
};

// Public endpoint to get landing carousel images
router.get('/landing-images', async (req, res, next) => {
  try {
    // Fetch images from the public table
    const { data, error } = await supabaseAnon
      .from('landing_carousel_images')
      .select('id, image_url, sort_order')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error("Error fetching landing images:", error);
      throw new Error(error.message);
    }

    // Map to the expected LandingImage format and add public URL
    const imagesWithUrls = data.map((row) => ({
      id: row.id,
      url: getPublicUrl('landing-carousel', row.image_url),
      sortOrder: row.sort_order,
    }));

    res.json(imagesWithUrls);
  } catch (error) {
    next(error);
  }
});

module.exports = router;