// backend/routes/ownerRoutes.cjs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { fetchOwnerMetrics, getMercadoPagoAuthUrl, handleMercadoPagoCallback, disconnectMercadoPago } = require('../services/ownerService');

// Middleware para verificar se o usuário é 'owner'
const checkOwnerRole = async (req, res, next) => {
    // A role é verificada no serviço agora, mas podemos manter uma verificação básica aqui
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Não autenticado.' });
    
    // A verificação de role real será feita no serviço que acessa o DB
    // Por enquanto, vamos assumir que se ele está chamando essa rota, ele deve ser um owner
    next();
};

// Endpoint para buscar todas as métricas do proprietário
router.get('/metrics', authenticateToken, checkOwnerRole, async (req, res) => {
    try {
        const metrics = await fetchOwnerMetrics(req.user.id);
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching owner metrics:', error);
        res.status(500).json({ error: 'Falha ao buscar métricas do proprietário.' });
    }
});

// Endpoint para obter a URL de autorização do Mercado Pago
router.get('/mp-auth-url', authenticateToken, checkOwnerRole, (req, res) => {
    try {
        const authUrl = getMercadoPagoAuthUrl(req.user.id);
        res.json({ url: authUrl });
    } catch (error) {
        console.error('Error getting MP Auth URL:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de callback do Mercado Pago
router.get('/mp-callback', async (req, res) => {
    const { code, state } = req.query; // state is the ownerId
    try {
        await handleMercadoPagoCallback(code, state);
        // Redireciona de volta para o painel do app com uma mensagem de sucesso
        res.redirect('/?mp_status=success');
    } catch (error) {
        console.error('Error in MP Callback:', error);
        // Redireciona de volta com uma mensagem de erro
        res.redirect('/?mp_status=error');
    }
});

// Endpoint para desconectar a conta do Mercado Pago
router.delete('/mp-disconnect', authenticateToken, checkOwnerRole, async (req, res) => {
    try {
        await disconnectMercadoPago(req.user.id);
        res.json({ message: 'Conta do Mercado Pago desconectada com sucesso.' });
    } catch (error) {
        console.error('Error disconnecting MP account:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;