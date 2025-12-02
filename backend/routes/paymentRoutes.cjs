const express = require('express');
const router = express.Router();
const { supabaseService, mercadopago } = require('../config');

// Create payment preference - AGORA É PÚBLICO
router.post('/create-preference', async (req, res) => {
  const { planId, returnUrl } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'ID do plano é obrigatório.' });
  }

  try {
    // 1. Buscar o plano pelo nome (planId é o nome do plano: 'starter' ou 'pro')
    const { data: plan, error: planError } = await supabaseService
      .from('plans')
      .select('*')
      .ilike('name', planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }
    
    if (plan.price <= 0) {
        return res.status(400).json({ error: 'Não é possível criar preferência de pagamento para planos gratuitos.' });
    }
    
    // 2. Verificar se o Mercado Pago está configurado
    if (!mercadopago.configurations.access_token) {
        // Lança um erro claro se o token estiver faltando
        throw new Error("MP_ACCESS_TOKEN não configurado no servidor. Verifique o .env.local e reinicie o backend.");
    }

    // 3. Criar a preferência de pagamento
    const preference = {
      items: [{
        title: `Plano ${plan.name} - Flow Designer`,
        description: `Acesso ao plano ${plan.name} com ${plan.image_quota} imagens/mês`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: parseFloat(plan.price)
      }],
      // URLs de retorno após o pagamento
      back_urls: {
        // Redireciona para a tela de autenticação/cadastro com o status e o plano
        success: `${process.env.FRONTEND_URL}/?status=success&plan=${planId}`,
        failure: `${process.env.FRONTEND_URL}/?status=failure&plan=${planId}`,
        pending: `${process.env.FRONTEND_URL}/?status=pending&plan=${planId}`
      },
      auto_return: 'approved',
      // O external_reference é usado para identificar a transação no webhook
      external_reference: `plan_${plan.id}_${Date.now()}`,
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      metadata: {
        plan_id: plan.id,
        plan_name: plan.name
      }
    };

    const response = await mercadopago.preferences.create(preference);
    
    // 4. Retorna o init_point (URL de checkout do Mercado Pago)
    res.status(200).json({
      preferenceId: response.body.id,
      initPoint: response.body.init_point
    });
  } catch (error) {
    console.error('Payment preference error:', error);
    // Retorna um erro JSON claro para o frontend
    res.status(500).json({ error: error.message || 'Erro ao criar preferência de pagamento.' });
  }
});

// Handle payment webhook
router.post('/webhook', async (req, res) => {
  try {
    const paymentData = req.body;
    
    if (paymentData.type === 'payment') {
      const paymentId = paymentData.data.id;
      
      // Busca os detalhes do pagamento usando o SDK
      const payment = await mercadopago.payment.findById(paymentId);
      
      if (payment.body.status === 'approved') {
        const { metadata } = payment.body;
        
        // Neste ponto, o usuário ainda não está logado/cadastrado.
        // A lógica de associação do plano ao usuário é feita no frontend (AppContent.tsx)
        // após o redirecionamento para a tela de cadastro.
        
        console.log(`Pagamento ${paymentId} aprovado para o plano ${metadata.plan_name}. Aguardando cadastro/login do usuário.`);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).send('ERROR');
  }
});

module.exports = router;