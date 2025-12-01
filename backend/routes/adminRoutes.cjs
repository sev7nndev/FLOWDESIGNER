// backend/routes/adminRoutes.cjs
const express = require('express');
const router = express.Router();
const { uploadLandingImage, fetchLandingImages, deleteLandingImage } = require('../services/adminService');
const { checkRole } = require('../middleware/authMiddleware');

// Rota para upload de imagem da Landing Page (Apenas para Dev/Admin)
router.post('/landing-images/upload', checkRole(['dev', 'owner']), async (req, res) => {
    const { fileBase64, fileName, userId } = req.body;

    if (!fileBase64 || !fileName || !userId) {
        return res.status(400).json({ error: "Dados de upload incompletos." });
    }

    try {
        const image = await uploadLandingImage(fileBase64, fileName, userId);
        res.status(201).json({ message: "Imagem da landing page enviada com sucesso.", image });
    } catch (error) {
        console.error("Error in /admin/landing-images/upload:", error.message);
        // Retorna 500 com a mensagem de erro detalhada do serviço
        res.status(500).json({ error: error.message || "Falha interna ao processar o upload da imagem." });
    }
});

// Rota para deletar imagem da Landing Page (Apenas para Dev/Admin)
router.delete('/landing-images/:id', checkRole(['dev', 'owner']), async (req, res) => {
    const { id } = req.params;
    const { imagePath } = req.body;

    if (!imagePath) {
        return res.status(400).json({ error: "Caminho da imagem é obrigatório para exclusão." });
    }

    try {
        await deleteLandingImage(id, imagePath);
        res.status(200).json({ message: "Imagem da landing page deletada com sucesso." });
    } catch (error) {
        console.error("Error in /admin/landing-images/delete:", error.message);
        res.status(500).json({ error: error.message || "Falha interna ao deletar a imagem." });
    }
});

module.exports = router;