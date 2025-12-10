## ⚠️ INSTRUÇÃO MANUAL - Adicione ao server.cjs

**Arquivo**: `backend/server.cjs`
**Localização**: Após a rota `/api/generate` (linha ~300)

**Copie e cole este código**:

```javascript
// 1.4. ULTRA-ADVANCED ROUTE - Prompts baseados em exemplos profissionais
app.post("/api/generate-ultra", generationLimiter, async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Não autorizado" });

    console.log(
      "🎨 [ULTRA-ADVANCED] Iniciando geração com prompts profissionais..."
    );

    const businessData = {
      nome: req.body.promptInfo?.companyName,
      descricao: req.body.promptInfo?.details,
      telefone: req.body.promptInfo?.phone,
      whatsapp: req.body.promptInfo?.phone,
      addressStreet: req.body.promptInfo?.addressStreet,
      addressNumber: req.body.promptInfo?.addressNumber,
      addressNeighborhood: req.body.promptInfo?.addressNeighborhood,
      addressCity: req.body.promptInfo?.addressCity,
      servicos: req.body.promptInfo?.details,
      instagram: req.body.promptInfo?.instagram,
    };

    // Verifica quota
    if (user.role !== "owner" && user.role !== "dev") {
      const { data: usage } = await globalSupabase
        .from("user_usage")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!usage || usage.generations_used >= usage.generations_limit) {
        return res.status(403).json({
          error: "Quota excedida",
          used: usage?.generations_used || 0,
          limit: usage?.generations_limit || 0,
        });
      }
    }

    // Gera com prompts ultra-avançados
    const ultraGenerator = require("./ultraAdvancedImagenGenerator.cjs");
    const imageBase64 = await ultraGenerator.generateProfessionalFlyer(
      businessData
    );

    // Atualiza quota
    if (user.role !== "owner" && user.role !== "dev") {
      const { data: usage } = await globalSupabase
        .from("user_usage")
        .select("*")
        .eq("user_id", user.id)
        .single();

      await globalSupabase
        .from("user_usage")
        .update({ generations_used: (usage?.generations_used || 0) + 1 })
        .eq("user_id", user.id);
    }

    // Salva no histórico
    try {
      await globalSupabase.from("images").insert({
        user_id: user.id,
        image_url: `data:image/png;base64,${imageBase64}`,
        metadata: {
          method: "ultra_advanced_imagen",
          businessData: businessData,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (saveError) {
      console.error("⚠️ Erro ao salvar:", saveError.message);
    }

    res.json({
      success: true,
      image: {
        id: Date.now().toString(),
        image_url: `data:image/png;base64,${imageBase64}`,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [ULTRA-ADVANCED] Erro:", error);
    res.status(500).json({ error: error.message });
  }
});
```

## 📍 Onde Adicionar:

1. Abra `backend/server.cjs`
2. Procure por `// 1.5. Enhance Prompt Route` (linha ~302)
3. Cole o código **ANTES** dessa linha
4. Salve o arquivo
5. Reinicie o servidor

## ✅ Depois:

O sistema vai usar **APENAS Imagen 4.0** para gerar os flyers com os prompts ultra-detalhados baseados nos exemplos profissionais que você mostrou!
