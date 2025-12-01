// backend/routes/ownerRoutes.cjs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { fetchOwnerMetrics } = require('../services/ownerService');

// Middleware para verificar se o usuário é 'owner'
const checkOwnerRole = (req, res, next) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Acesso negado. Apenas o proprietário pode acessar este painel.' });
    }
    next();
};

// Endpoint para buscar todas as métricas do proprietário
router.get('/metrics', authenticateToken, checkOwnerRole, async (req, res, next) => {
    try {
        const metrics = await fetchOwnerMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching owner metrics:', error);
        res.status(500).json({ error: 'Falha ao buscar métricas do proprietário.' });
    }
});

module.exports = router;