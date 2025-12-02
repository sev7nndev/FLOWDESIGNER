// backend/routes/paymentRoutes.cjs
const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { authMiddleware } = require('../middleware/authMiddleware'); // Corrigido caminho

// Rota para criar uma preferência de pagamento (protegida)
router.post('/create-preference', authMiddleware, async (req, res) => {
  const userId = req.user.id; // Do middleware de autenticação
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'O ID do plano é obrigatório.' });
  }

  try {
    const init_point = await paymentService.createPaymentPreference(userId, planId);
    res.status(200).json({ init_point });
  } catch (error) {
    console.error("Error creating payment preference:", error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para o webhook do Mercado Pago (pública)
router.post('/webhook', async (req, res) => {
  try {
    await paymentService.handleWebhook(req.body);
    res.status(200).send('Webhook recebido.');
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: 'Erro ao processar o webhook.' });
  }
});

module.exports = router;