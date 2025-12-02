// backend/routes/devRoutes.cjs
const express = require('express');
const router = express.Router();
const { supabaseService } = require('../config');
const { authMiddleware } = require('../middleware/authMiddleware'); // Corrigido caminho
const { roleMiddleware } = require('../middleware/roleMiddleware'); // Corrigido caminho

// Proteger todas as rotas de dev
router.use(authMiddleware);
router.use(roleMiddleware(['dev']));

// Rota para atualizar os detalhes de um plano
router.post('/update-plan', async (req, res) => {
  const { planId, price, image_quota } = req.body;

  if (!planId || price === undefined || image_quota === undefined) {
    return res.status(400).json({ error: 'Dados do plano incompletos.' });
  }

  try {
    const { data, error } = await supabaseService
      .from('plans')
      .update({
        price: Number(price),
        image_quota: parseInt(image_quota)
      })
      .eq('id', planId)
      .select();

    if (error) throw error;

    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ error: 'Não foi possível atualizar o plano.' });
  }
});

// TODO: Adicionar rotas para 'fix-app' e 'change-carousel-images'

module.exports = router;