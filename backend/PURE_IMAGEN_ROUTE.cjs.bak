// ROTA PURE IMAGEN - Adicione ao server.cjs

// PURE IMAGEN ROUTE - Gera TUDO com Imagen 4.0 (SEM Puppeteer)
app.post('/api/generate-pure-imagen', generationLimiter, async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    console.log('🎨 [PURE IMAGEN] Iniciando geração pura...');

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

    // Gera APENAS com Imagen 4.0
    const pureImagenGenerator = require('./pureImagenGenerator.cjs');
    const imageBase64 = await pureImagenGenerator.generatePureImagen(businessData);

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
        image_url: `data:image/png;base64,${imageBase64}`,
        metadata: {
          method: 'pure_imagen',
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
      method: 'pure_imagen',
      message: 'Gerado 100% com Imagen 4.0 (sem overlay)'
    });

  } catch (error) {
    console.error('❌ [PURE IMAGEN] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});
