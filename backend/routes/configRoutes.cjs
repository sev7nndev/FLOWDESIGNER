const express = require('express');
const router = express.Router();
const { supabaseService } = require('../config');

// Get app configuration
router.get('/:key', async (req, res) => {
  const { key } = req.params;
  
  try {
    const { data: config, error } = await supabaseService
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Configuração não encontrada.' });
      }
      console.error('Config fetch error:', error);
      return res.status(500).json({ error: 'Erro ao buscar configuração.' });
    }

    res.status(200).json(config.value);
  } catch (error) {
    console.error('Config endpoint error:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Update app configuration (service role only)
router.put('/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  try {
    const { data: config, error } = await supabaseService
      .from('app_config')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Config update error:', error);
      return res.status(500).json({ error: 'Erro ao atualizar configuração.' });
    }

    res.status(200).json(config);
  } catch (error) {
    console.error('Config update endpoint error:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;