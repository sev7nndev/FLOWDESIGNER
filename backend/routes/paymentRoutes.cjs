const express = require('express');
const router = express.Router();
// const { authenticateToken } = require('../middleware/auth.cjs'); // Removido
const { supabaseService, mercadopago } = require('../config.cjs');

// Create payment preference - AGORA É PÚBLICO
router.post('/create-preference', async (req, res) => {
  const { planId, returnUrl } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'ID do plano é obrigatório.' });
  }

  try {
    const { data: plan, error: planError } = await supabaseService
      .from('plans')
      .select('*')
      .ilike('name', planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    const preference = {
      items: [{
        title: `Plano ${plan.name} - Flow Designer`,
        description: `Acesso ao plano ${plan.name} com ${plan.image_quota} imagens/mês`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: parseFloat(plan.price)
      }],
      back_urls: {
        success: returnUrl || `${process.env.FRONTEND_URL}/`,
        failure: returnUrl || `${process.env.FRONTEND_URL}/`,
        pending: returnUrl || `${process.env.FRONTEND_URL}/`
      },
      auto_return: 'approved',
      // Não temos userId ainda, então o external_reference será mais simples
      external_reference: `plan_${plan.id}_${Date.now()}`,
      metadata: {
        // Guardamos o ID do plano (UUID) para o webhook
        plan_id: plan.id 
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
      
      const payment = await mercadopago.payment.findById(paymentId);
      
      if (payment.body.status === 'approved') {
        // O webhook não pode mais atualizar a assinatura diretamente,
        // pois não temos o user_id no momento do pagamento.
        // A lógica de associar o plano ao usuário foi movida para o momento do cadastro.
        console.log(`Pagamento ${paymentId} aprovado para o plano ${payment.body.metadata.plan_id}. Aguardando cadastro do usuário.`);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).send('ERROR');
  }
});

module.exports = router;