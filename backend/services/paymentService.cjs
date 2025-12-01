// backend/services/paymentService.cjs
const { supabaseService } = require('../config');
const { MercadoPagoConfig, Preference } = require('mercadopago');

/**
 * Cria uma preferência de checkout no Mercado Pago usando o token do Dono do SaaS.
 * O pagamento será creditado diretamente na conta do Dono.
 * @param {string} ownerId - ID do Dono do SaaS (tenant).
 * @param {string} planId - ID do plano (ex: 'pro', 'starter').
 * @param {number} price - Preço do plano.
 * @returns {Promise<string>} URL de checkout do Mercado Pago.
 */
const createSubscriptionCheckout = async (ownerId, planId, price) => {
    // 1. Buscar o Access Token do Dono do SaaS
    const { data: mpAccount, error: mpError } = await supabaseService
        .from('owners_payment_accounts')
        .select('access_token')
        .eq('owner_id', ownerId)
        .single();

    if (mpError || !mpAccount || !mpAccount.access_token) {
        throw new Error("Conta de pagamento do proprietário não conectada ou token ausente.");
    }
    
    const ownerAccessToken = mpAccount.access_token;

    // 2. Inicializar o cliente MP com o token do Dono
    const client = new MercadoPagoConfig({ accessToken: ownerAccessToken });
    const preference = new Preference(client);

    // 3. Criar a preferência de pagamento
    const preferenceBody = {
        items: [
            {
                title: `Assinatura Flow Designer - Plano ${planId.toUpperCase()}`,
                quantity: 1,
                unit_price: price,
            }
        ],
        // Configurações de redirecionamento e notificação (Webhooks)
        back_urls: {
            success: `${process.env.APP_BASE_URL}/?payment_status=success&plan=${planId}`,
            failure: `${process.env.APP_BASE_URL}/?payment_status=failure&plan=${planId}`,
            pending: `${process.env.APP_BASE_URL}/?payment_status=pending&plan=${planId}`,
        },
        auto_return: "approved",
        notification_url: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/mercadopago`, // Endpoint que você configurará depois
        external_reference: `${ownerId}_${planId}_${Date.now()}`, // Referência para rastreamento
    };

    const result = await preference.create({ body: preferenceBody });
    
    // Retorna a URL de checkout (usando sandbox ou production, dependendo do ambiente)
    return result.init_point;
};

module.exports = {
    createSubscriptionCheckout,
};