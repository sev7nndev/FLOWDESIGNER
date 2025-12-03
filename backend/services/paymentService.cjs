// backend/services/paymentService.cjs
const mercadopago = require('mercadopago');
const { supabaseService } = require('../config'); // Usar a service key para operações críticas

// TODO: Mover para variáveis de ambiente
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Cria uma preferência de pagamento no Mercado Pago para um plano específico.
 * @param {string} userId - O ID do usuário que está comprando.
 * @param {string} planId - O ID do plano a ser comprado.
 * @returns {Promise<string>} A URL de inicialização do pagamento (init_point).
 */
const createPaymentPreference = async (userId, planId) => {
  // 1. Buscar as credenciais do dono do SaaS
  const { data: ownerAccount, error: ownerError } = await supabaseService
    .from('app_config') // Usando app_config para armazenar credenciais
    .select('value')
    .eq('key', 'mp_owner_credentials') // Chave para as credenciais do dono
    .single();

  if (ownerError || !ownerAccount) {
    console.error("Mercado Pago account for SaaS owner not found:", ownerError);
    throw new Error("A conta de pagamento do vendedor não está configurada.");
  }

  const ownerCredentials = ownerAccount.value; // Deve ser um objeto { access_token, ... }

  // 2. Buscar os detalhes do plano
  const { data: plan, error: planError } = await supabaseService
    .from('plans')
    .select('name, price')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    throw new Error("Plano não encontrado.");
  }

  if (plan.price <= 0) {
    throw new Error("Não é possível pagar por um plano gratuito.");
  }

  // 3. Configurar o SDK do Mercado Pago com o token do dono
  mercadopago.configure({
    access_token: ownerCredentials.access_token,
  });

  // 4. Criar a preferência de pagamento
  const preference = {
    items: [
      {
        title: `Plano ${plan.name} - Flow Designer`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: Number(plan.price),
      }
    ],
    payer: {
      // Idealmente, buscaríamos o email do usuário
      // mas para simplificar, podemos omitir por enquanto
    },
    back_urls: {
      success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success`,
      failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=failure`,
      pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=pending`,
    },
    auto_return: 'approved',
    notification_url: `${BACKEND_URL}/api/payments/webhook`,
    external_reference: JSON.stringify({ userId, planId }), // Passar IDs para o webhook
  };

  const response = await mercadopago.preferences.create(preference);
  return response.body.init_point;
};

/**
 * Processa o webhook do Mercado Pago.
 * @param {object} paymentData - Os dados recebidos do webhook.
 */
const handleWebhook = async (paymentData) => {
  if (paymentData.type !== 'payment') {
    return; // Ignorar outros tipos de notificação
  }

  // TODO: Verificar a assinatura do webhook para segurança
  const paymentId = paymentData.data.id;

  // 1. Buscar as credenciais do dono do SaaS para consultar o pagamento
  const { data: ownerAccount } = await supabaseService
    .from('app_config')
    .select('value')
    .eq('key', 'mp_owner_credentials')
    .single();

  if (!ownerAccount) throw new Error("Owner MP account not found.");
  const ownerCredentials = ownerAccount.value;
  mercadopago.configure({
    access_token: ownerCredentials.access_token,
  });

  // 2. Buscar os detalhes do pagamento no Mercado Pago
  const payment = await mercadopago.payment.get(paymentId);
  const { status, external_reference, amount } = payment.body;

  if (status === 'approved') {
    const { userId, planId } = JSON.parse(external_reference);

    // 3. Verificar se este pagamento já foi processado
    const { data: existingPayment } = await supabaseService
      .from('payments')
      .select('id')
      .eq('mp_payment_id', paymentId)
      .limit(1);

    if (existingPayment && existingPayment.length > 0) {
      console.log(`Webhook: Pagamento ${paymentId} já processado.`);
      return;
    }

    // 4. Atualizar a assinatura do usuário
    const { data: updatedSubscription, error: subError } = await supabaseService
      .from('subscriptions')
      .update({
        plan_id: planId,
        status: 'active'
      })
      .eq('user_id', userId)
      .select('id')
      .single();

    if(subError) throw new Error(`Erro ao atualizar assinatura: ${subError.message}`);

    // 5. Registrar o pagamento no banco de dados
    await supabaseService.from('payments').insert({
      user_id: userId,
      subscription_id: updatedSubscription.id,
      amount: amount,
      status: 'succeeded',
      mp_payment_id: paymentId,
    });

    // 6. Atualizar a role do usuário no perfil para corresponder ao plano
    const { data: plan } = await supabaseService.from('plans').select('name').eq('id', planId).single();
    await supabaseService
      .from('profiles')
      .update({
        role: plan.name.toLowerCase()
      })
      .eq('id', userId);

    console.log(`Webhook: Assinatura do usuário ${userId} atualizada para o plano ${planId}.`);
  }
};

module.exports = {
  createPaymentPreference,
  handleWebhook,
};