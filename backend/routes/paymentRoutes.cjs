const express = require('express');
const router = express.Router();
const { supabaseService, mercadopago } = require('../config');

// Create payment preference
router.post('/create-preference', async (req, res) => {
  const { planId, returnUrl } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'ID do plano é obrigatório.' });
  }

  try {
    console.log('🔍 Creating payment preference for plan:', planId);
    
    // 1. Buscar o plano pelo NOME (não pelo ID)
    const { data: plan, error: planError } = await supabaseService
      .from('plans')
      .select('*')
      .ilike('name', planId) // Busca pelo nome (Free, Starter, Pro)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('❌ Plan not found:', planError);
      return res.status(404).json({ 
        error: `Plano "${planId}" não encontrado.`,
        details: planError?.message 
      });
    }
    
    console.log('✅ Plan found:', plan.name, 'Price:', plan.price);
    
    if (plan.price <= 0) {
        console.log('ℹ️  Free plan selected, no payment needed');
        return res.status(400).json({ 
            error: 'Não é possível criar preferência de pagamento para planos gratuitos.' 
        });
    }
    
    // 2. Verificar se o Mercado Pago está configurado
    if (!mercadopago.configurations.access_token || mercadopago.configurations.access_token === 'test_access_token') {
        console.error('❌ Mercado Pago not configured');
        throw new Error("MP_ACCESS_TOKEN não configurado. Verifique o .env.local.");
    }

    console.log('✅ Mercado Pago configured');

    // 3. Criar a preferência de pagamento
    const preference = {
      items: [{
        title: `Plano ${plan.name} - Flow Designer`,
        description: `Acesso ao plano ${plan.name} com ${plan.image_quota} imagens/mês`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: parseFloat(plan.price)
      }],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/?status=success&plan=${planId}`,
        failure: `${process.env.FRONTEND_URL}/?status=failure&plan=${planId}`,
        pending: `${process.env.FRONTEND_URL}/?status=pending&plan=${planId}`
      },
      auto_return: 'approved',
      external_reference: `plan_${plan.id}_${Date.now()}`,
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      metadata: {
        plan_id: plan.id,
        plan_name: plan.name
      }
    };

    console.log('🔗 Creating Mercado Pago preference...');
    const response = await mercadopago.preferences.create(preference);
    
    console.log('✅ Preference created successfully');
    
    res.status(200).json({
      preferenceId: response.body.id,
      initPoint: response.body.init_point
    });
  } catch (error) {
    console.error('❌ Payment preference error:', error);
    
    let errorMessage = 'Erro ao criar preferência de pagamento.';
    
    if (error.message && error.message.includes('MP_ACCESS_TOKEN')) {
        errorMessage = error.message;
    } else if (error.cause && error.cause.length > 0 && error.cause[0].message) {
        errorMessage = `Erro MP: ${error.cause[0].message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Handle payment webhook
router.post('/webhook', async (req, res) => {
  try {
    const paymentData = req.body;
    console.log('🔔 Payment webhook received:', paymentData.type);
    
    if (paymentData.type === 'payment') {
      const paymentId = paymentData.data.id;
      
      console.log('💳 Processing payment:', paymentId);
      
      const payment = await mercadopago.payment.findById(paymentId);
      
      if (payment.body.status === 'approved') {
        const { metadata } = payment.body;
        console.log(`✅ Pagamento ${paymentId} aprovado para o plano ${metadata.plan_name}`);
        
        // Aqui você pode implementar a lógica para ativar a assinatura do usuário
        // Por enquanto, apenas logamos o sucesso
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Payment webhook error:', error);
    res.status(500).send('ERROR');
  }
};

module.exports = router;