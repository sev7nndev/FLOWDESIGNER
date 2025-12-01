// backend/routes/ownerRoutes.cjs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { fetchOwnerMetrics, createBillingPortalSession, updateClientPlan } = require('../services/ownerService'); // Importando a nova função
const sanitizeHtml = require('sanitize-html');

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

// Endpoint para criar uma sessão do portal de faturamento para o usuário autenticado
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

// NOVO ENDPOINT: Atualiza o plano de um cliente
router.post('/update-plan', authenticateToken, checkOwnerRole, async (req, res) => {
    const { clientId, newPlan, newStatus } = req.body;

    // Validação e Sanitização
    if (!clientId || !newPlan || !newStatus) {
        return res.status(400).json({ error: 'ID do cliente, novo plano e status são obrigatórios.' });
    }
    
    const safeNewPlan = sanitizeHtml(newPlan, { allowedTags: [], allowedAttributes: {} });
    const safeNewStatus = sanitizeHtml(newStatus, { allowedTags: [], allowedAttributes: {} });
    
    if (!['free', 'starter', 'pro'].includes(safeNewPlan)) {
        return res.status(400).json({ error: 'Plano inválido.' });
    }
    if (!['on', 'paused', 'cancelled'].includes(safeNewStatus)) {
        return res.status(400).json({ error: 'Status inválido.' });
    }

    try {
        await updateClientPlan(clientId, safeNewPlan, safeNewStatus);
        res.status(200).json({ message: 'Plano do cliente atualizado com sucesso.' });
    } catch (error) {
        console.error('Error updating client plan:', error);
        res.status(500).json({ error: error.message || 'Falha ao atualizar o plano do cliente.' });
    }
});

module.exports = router;