const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ownerController = require('../controllers/ownerController');

// Middleware to check if user is owner
const checkOwnerRole = async (req, res, next) => {
  const { supabaseService } = require('../config');
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  try {
    const { data: profile, error } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile || profile.role !== 'owner') {
      return res.status(403).json({ error: 'Acesso negado. Apenas proprietários podem acessar.' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar permissões.' });
  }
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