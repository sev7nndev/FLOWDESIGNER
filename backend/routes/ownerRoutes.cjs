const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ownerController = require('../controllers/ownerController');

// Middleware to check if user is owner
const checkOwnerRole = async (req, res, next) => {
  const user = req.user;
  
  if (!user || !user.profile) {
    return res.status(401).json({ error: 'Não autenticado ou perfil não carregado.' });
  }

  const { role } = user.profile;
  
  if (role !== 'owner') {
    return res.status(403).json({ error: 'Acesso negado. Apenas proprietários podem acessar.' });
  }

  next();
};

// Metrics endpoint
router.get('/metrics', authenticateToken, checkOwnerRole, ownerController.getOwnerMetrics);

// Mercado Pago endpoints
router.get('/mp-auth-url', authenticateToken, checkOwnerRole, ownerController.getMercadoPagoAuthUrl);
router.get('/mp-callback', ownerController.handleMercadoPagoCallback);
router.delete('/mp-disconnect', authenticateToken, checkOwnerRole, ownerController.disconnectMercadoPago);

// Chat history endpoint
router.get('/chat-history', authenticateToken, checkOwnerRole, ownerController.getChatHistory);

module.exports = router;