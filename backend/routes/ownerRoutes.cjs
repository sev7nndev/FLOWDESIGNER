// backend/routes/ownerRoutes.cjs
const express = require('express');
const router = express.Router();
const { fetchOwnerMetrics } = require('../services/ownerService');
const { protect } = require('../middleware/authMiddleware.cjs'); // Corrigido o caminho e nome do arquivo

// Rota para buscar métricas do painel do proprietário
router.get('/metrics', protect(['owner']), async (req, res) => {
    try {
        const metrics = await fetchOwnerMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        // Captura qualquer erro lançado pelo ownerService (incluindo falhas do Admin API)
        console.error("Error fetching owner metrics:", error.message, error.stack);
        
        // Garante que uma resposta JSON estruturada seja SEMPRE enviada
        res.status(500).json({ 
            error: error.message || "Internal Server Error. Check backend logs for details." 
        });
    }
});

module.exports = router;