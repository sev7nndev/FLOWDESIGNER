// EXPERIMENTAL ROUTE - Add this to server.cjs after line 300

// 1.4. EXPERIMENTAL: Imagen with Text (with Smart Fallback)
app.post('/api/generate-experimental', generationLimiter, async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    console.log('🧪 [EXPERIMENTAL] Iniciando geração experimental...');

    // Prepara dados do negócio
    const businessData = {
      nome: req.body.nome,
      descricao: req.body.descricao,
      telefone: req.body.whatsapp || req.body.telefone,
      whatsapp: req.body.whatsapp,
      addressStreet: req.body.addressStreet,
      addressNumber: req.body.addressNumber,
      addressNeighborhood: req.body.addressNeighborhood,
      addressCity: req.body.addressCity,
      servicos: req.body.servicos,
      instagram: req.body.instagram
    };

    // Verifica quota (exceto owner/dev)
    if (user.role !== 'owner' && user.role !== 'dev') {
      const { data: usage } = await globalSupabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!usage || usage.generations_used >= usage.generations_limit) {
        return res.status(403).json({ 
          error: 'Quota excedida',
          used: usage?.generations_used || 0,
          limit: usage?.generations_limit || 0
        });
      }
    }

    // Gera com sistema experimental
    const experimentalGenerator = require('./experimentalTextGenerator.cjs');
    const result = await experimentalGenerator.generateSmartFlyer(businessData);

    // Atualiza quota (exceto owner/dev)
    if (user.role !== 'owner' && user.role !== 'dev') {
      const { data: usage } = await globalSupabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      await globalSupabase
        .from('user_usage')
        .update({ generations_used: (usage?.generations_used || 0) + 1 })
        .eq('user_id', user.id);
    }

    // Salva no histórico
    try {
      await globalSupabase.from('images').insert({
        user_id: user.id,
        image_url: `data:image/png;base64,${result.imageBase64}`,
        metadata: {
          method: result.method,
          quality: result.quality,
          businessData: businessData,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (saveError) {
      console.error('⚠️ Erro ao salvar:', saveError.message);
    }

    res.json({
      success: true,
      imageBase64: result.imageBase64,
      method: result.method,
      quality: result.quality,
      message: result.message
    });

  } catch (error) {
    console.error('❌ [EXPERIMENTAL] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});
