// backend/routes/ownerRoutes.cjs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { fetchOwnerMetrics, createBillingPortalSession } = require('../services/ownerService'); // Importando a nova função

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

// NOVO ENDPOINT: Cria uma sessão do portal de faturamento para o usuário autenticado
router.post('/billing-portal', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const redirectUrl = await createBillingPortalSession(userId);
        res.json({ redirectUrl });
    } catch (error) {
        console.error('Error creating billing portal session:', error);
        res.status(500).json({ error: 'Falha ao criar sessão do portal de faturamento.' });
    }
});

module.exports = router;