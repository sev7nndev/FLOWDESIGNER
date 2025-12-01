// backend/routes/paymentRoutes.cjs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createSubscriptionCheckout } = require('../services/paymentService');
const { supabaseAnon } = require('../config');

// Endpoint para iniciar o checkout de assinatura
router.post('/create-checkout', authenticateToken, async (req, res) => {
    const { planId } = req.body;
    const userId = req.user.id; // O cliente que está comprando

    if (!planId) {
        return res.status(400).json({ error: 'ID do plano é obrigatório.' });
    }

    try {
        // 1. Determinar o Dono do SaaS (Tenant ID)
        // Como este é um SaaS multi-tenant, precisamos saber quem é o Dono para usar o token dele.
        // Por enquanto, vamos assumir que o Dono é o único usuário com role 'owner' (você pode refinar isso depois).
        const { data: ownerData, error: ownerError } = await supabaseAnon
            .from('profiles')
            .select('id')
            .eq('role', 'owner')
            .limit(1)
            .single();
            
        if (ownerError || !ownerData) {
            return res.status(500).json({ error: 'Nenhum proprietário de SaaS configurado para receber pagamentos.' });
        }
        const ownerId = ownerData.id;

        // 2. Buscar o preço do plano
        const { data: planData, error: planError } = await supabaseAnon
            .from('plan_settings')
            .select('price')
            .eq('id', planId)
            .single();

        if (planError || !planData) {
            return res.status(404).json({ error: 'Plano não encontrado.' });
        }
        const price = planData.price;

        // 3. Criar o checkout usando o token do Dono
        const checkoutUrl = await createSubscriptionCheckout(ownerId, planId, price);

        res.json({ checkoutUrl });

    } catch (error) {
        console.error('Erro ao criar checkout do Mercado Pago:', error.message);
        res.status(500).json({ error: error.message || 'Falha ao iniciar o pagamento.' });
    }
});

module.exports = router;