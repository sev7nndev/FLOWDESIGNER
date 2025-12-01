// backend/routes/publicRoutes.cjs
const express = require('express');
const router = express.Router();
const { fetchLandingImages } = require('../services/adminService'); // Reutilizando a função de serviço

// Rota pública para buscar todas as imagens ativas da Landing Page
router.get('/landing-images', async (req, res) => {
    try {
        const images = await fetchLandingImages();
        res.status(200).json(images);
    } catch (error) {
        console.error("Error fetching public landing images:", error);
        res.status(500).json({ error: "Falha ao carregar imagens públicas." });
    }
});

// ... (outras rotas públicas)

module.exports = router;