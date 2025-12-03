const express = require('express');
const { mercadopago, supabaseServiceRole, FRONTEND_URL } = require('../config.cjs');
const { verifyAuth } = require('../middleware/auth.cjs');

const router = express.Router();

// Rota de Iniciação de Assinatura (Mercado Pago)
router.post('/', verifyAuth, async (req, res) => {
    const { planId } = req.body;
    
    if (!mercadopago) {
        return res.status(500).json({ error: "Erro de configuração: Módulo Mercado Pago não carregado." });
    }
    
    if (!supabaseServiceRole) {
        return res.status(500).json({ error: 'Erro de configuração: Supabase Service Role Client ausente.' });
    }
    
    console.log(`User ${req.user.id} initiating subscription for plan ${planId}`);
    
    const { data: planSettings, error } = await supabaseServiceRole
        .from('plan_settings')
        .select('price')
        .eq('id', planId)
        .single();
        
    if (error || !planSettings) {
        return res.status(400).json({ error: "Plano inválido ou não encontrado." });
    }
    
    const price = planSettings.price;
    
    const preference = {
        items: [{
            title: `Assinatura Flow Designer - ${planId.toUpperCase()}`,
            unit_price: parseFloat(price),
            quantity: 1,
        }],
        back_urls: {
            success: `${FRONTEND_URL}/checkout/success?plan=${planId}`,
            failure: `${FRONTEND_URL}/checkout/failure?plan=${planId}`,
            pending: `${FRONTEND_URL}/checkout/pending?plan=${planId}`,
        },
        auto_return: "approved",
        external_reference: `${req.user.id}_${planId}_${Date.now()}`,
        payer: {
            email: req.user.email,
        }
    };
    
    // NOTE: A chamada real ao MP deve ser feita aqui:
    // const mpResponse = await mercadopago.preferences.create(preference);
    // const paymentUrl = mpResponse.body.init_point;
    
    // Mock URL
    const paymentUrl = `https://mock-mercadopago.com/payment?plan=${planId}&price=${price}`;

    res.json({ paymentUrl });
});

module.exports = router;