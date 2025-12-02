// backend/routes/configRoutes.cjs
const express = require('express');
const router = express.Router();
const { supabaseAnon } = require('../config');

// Rota para buscar configurações globais
router.get('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const { data, error } = await supabaseAnon
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: `Configuração '${key}' não encontrada.` });
    }

    res.status(200).json(data.value);
  } catch (error) {
    console.error(`Error fetching config for ${key}:`, error);
    res.status(500).json({ error: 'Erro ao buscar a configuração.' });
  }
});

module.exports = router;