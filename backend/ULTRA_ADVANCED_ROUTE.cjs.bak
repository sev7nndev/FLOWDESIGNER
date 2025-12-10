// ROTA ULTRA-ADVANCED - Adicione ao server.cjs

// ULTRA-ADVANCED ROUTE - Prompts baseados em exemplos profissionais
app.post('/api/generate-ultra', generationLimiter, async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    console.log('🎨 [ULTRA-ADVANCED] Iniciando geração com prompts profissionais...');

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

    // Verifica quota
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

    // Gera com prompts ultra-avançados
    const ultraGenerator = require('./ultraAdvancedImagenGenerator.cjs');
    const imageBase64 = await ultraGenerator.generateProfessionalFlyer(businessData);

    // Atualiza quota
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
        image_url: `data:image/png;base64,${imageBase64}`,
        metadata: {
          method: 'ultra_advanced_imagen',
          businessData: businessData,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (saveError) {
      console.error('⚠️ Erro ao salvar:', saveError.message);
    }

    res.json({
      success: true,
      imageBase64: imageBase64,
      method: 'ultra_advanced_imagen',
      message: 'Gerado com prompts ultra-avançados baseados em exemplos profissionais'
    });

  } catch (error) {
    console.error('❌ [ULTRA-ADVANCED] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});
