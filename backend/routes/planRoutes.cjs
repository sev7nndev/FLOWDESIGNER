const express = require('express');
const router = express.Router();
const { supabaseService } = require('../config');

// Get all available plans
router.get('/', async (req, res) => {
  try {
    const { data: plans, error } = await supabaseService
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.error('Plans fetch error:', error);
      return res.status(500).json({ error: 'Erro ao buscar planos.' });
    }

    res.status(200).json(plans);
  } catch (error) {
    console.error('Plans endpoint error:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Get user's current plan
router.get('/current', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    const { data: subscription, error: subError } = await supabaseService
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      // Return free plan as default
      const { data: freePlan } = await supabaseService
        .from('plans')
        .select('*')
        .eq('name', 'Free')
        .single();

      return res.status(200).json({
        plan: freePlan,
        subscription: null
      });
    }

    res.status(200).json({
      plan: subscription.plans,
      subscription: subscription
    });
  } catch (error) {
    console.error('Current plan error:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;