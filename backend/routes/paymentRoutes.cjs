const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabaseService, mercadopago } = require('../config');

// Create payment preference
router.post('/create-preference', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { planId, returnUrl } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'ID do plano é obrigatório.' });
  }

  try {
    // Get plan details
    const { data: plan, error: planError } = await supabaseService
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    // Create Mercado Pago preference
    const preference = {
      items: [{
        title: `Plano ${plan.name} - Flow Designer`,
        description: `Acesso ao plano ${plan.name} com ${plan.image_quota} imagens/mês`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: parseFloat(plan.price)
      }],
      back_urls: {
        success: returnUrl || `${process.env.FRONTEND_URL}/app`,
        failure: returnUrl || `${process.env.FRONTEND_URL}/app`,
        pending: returnUrl || `${process.env.FRONTEND_URL}/app`
      },
      auto_return: 'approved',
      external_reference: `${userId}_${planId}_${Date.now()}`,
      metadata: {
        user_id: userId,
        plan_id: planId
      }
    };

    const response = await mercadopago.preferences.create(preference);
    
    res.status(200).json({
      preferenceId: response.body.id,
      initPoint: response.body.init_point
    });
  } catch (error) {
    console.error('Payment preference error:', error);
    res.status(500).json({ error: 'Erro ao criar preferência de pagamento.' });
  }
});

// Handle payment webhook
router.post('/webhook', async (req, res) => {
  try {
    const paymentData = req.body;
    
    if (paymentData.type === 'payment') {
      const paymentId = paymentData.data.id;
      
      // Get payment details
      const payment = await mercadopago.payment.findById(paymentId);
      
      if (payment.body.status === 'approved') {
        const { user_id, plan_id } = payment.body.metadata;
        
        // Update or create subscription
        const { error: subError } = await supabaseService
          .from('subscriptions')
          .upsert({
            user_id,
            plan_id,
            status: 'active',
            mp_subscription_id: paymentId,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (subError) {
          console.error('Subscription update error:', subError);
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).send('ERROR');
  }
});

module.exports = router;