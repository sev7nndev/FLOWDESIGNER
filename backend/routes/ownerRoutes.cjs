// backend/routes/ownerRoutes.cjs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ownerController = require('../controllers/ownerController'); // Importando o novo controlador

// Middleware para verificar se o usuário é 'owner'
// NOTE: A verificação de role real é feita no serviço, mas mantemos este middleware para estrutura.
const checkOwnerRole = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }
    // A verificação de role real será feita no serviço que acessa o DB
    next();
};

// Endpoint para buscar todas as métricas do proprietário
router.get('/metrics', authenticateToken, checkOwnerRole, ownerController.getOwnerMetrics);

// Endpoint para obter a URL de autorização do Mercado Pago
router.get('/mp-auth-url', authenticateToken, checkOwnerRole, ownerController.getMercadoPagoAuthUrl);

// Endpoint de callback do Mercado Pago (Não requer authenticateToken/checkOwnerRole pois é um redirect externo)
router.get('/mp-callback', ownerController.handleMercadoPagoCallback);

// Endpoint para desconectar a conta do Mercado Pago
router.delete('/mp-disconnect', authenticateToken, checkOwnerRole, ownerController.disconnectMercadoPago);

module.exports = router;