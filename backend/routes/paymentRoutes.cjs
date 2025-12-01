const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.cjs');
const { stripe, supabaseService, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PLAN_PRICE_ID, STRIPE_START_PLAN_PRICE_ID } = require('../config.cjs');

// Rota para criar uma sessão de checkout do Stripe
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
    const { priceId } = req.body;
    const user = req.user;
    const appUrl = req.headers.origin || 'http://localhost:5173';

    if (!priceId) {
        return res.status(400).json({ error: 'Price ID é obrigatório.' });
    }
    
    if (priceId !== STRIPE_PRO_PLAN_PRICE_ID && priceId !== STRIPE_START_PLAN_PRICE_ID) {
        return res.status(400).json({ error: 'Price ID inválido.' });
    }

    try {
        // 1. Busca o perfil do usuário para ver se ele já é um cliente Stripe
        const { data: profile, error: profileError } = await supabaseService
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        let customerId = profile.stripe_customer_id;

        // 2. Se não for um cliente, cria um no Stripe e atualiza nosso banco
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: user.id },
            });
            customerId = customer.id;

            const { error: updateError } = await supabaseService
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id);

            if (updateError) throw updateError;
        }

        // 3. Cria a sessão de checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/`,
            metadata: {
                supabase_user_id: user.id,
            }
        });

        res.json({ sessionId: session.id });

    } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error);
        res.status(500).json({ error: 'Falha ao iniciar o processo de pagamento.' });
    }
});

// Rota para receber webhooks do Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Lida com o evento checkout.session.completed
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const supabaseUserId = session.metadata.supabase_user_id;
        const priceId = session.line_items.data[0].price.id;

        let newPlan = 'free';
        if (priceId === STRIPE_PRO_PLAN_PRICE_ID) newPlan = 'pro';
        if (priceId === STRIPE_START_PLAN_PRICE_ID) newPlan = 'starter';

        try {
            // Atualiza o role do usuário no 'profiles'
            const { error: profileError } = await supabaseService
                .from('profiles')
                .update({ role: newPlan })
                .eq('id', supabaseUserId);
            if (profileError) throw profileError;

            // Atualiza o plano e reseta o uso em 'user_usage'
            const { error: usageError } = await supabaseService
                .from('user_usage')
                .update({ plan_id: newPlan, current_usage: 0, cycle_start_date: new Date().toISOString() })
                .eq('user_id', supabaseUserId);
            if (usageError) throw usageError;

            console.log(`User ${supabaseUserId} successfully upgraded to ${newPlan} plan.`);
        } catch (error) {
            console.error('Error updating user plan after payment:', error);
            return res.status(500).json({ error: 'Failed to update user profile after payment.' });
        }
    }

    res.status(200).json({ received: true });
});

module.exports = router;