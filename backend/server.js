const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch'); // Instale: npm install node-fetch@2

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Conexão Admin com Supabase (Backend Only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use a Service Role Key aqui, não a Anon Key!
);

// --- ENDPOINT SEGURO: GERAÇÃO COMPLETA ---
app.post('/api/generate', async (req, res) => {
  try {
    const { promptInfo, userToken } = req.body;

    // 1. Verificar Usuário (Auth Guard)
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    if (authError || !user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    // 1.5. Verificar Autorização/Role (Critical Security Fix)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'client';

    // For this example, only 'admin' users are authorized to generate (simulating a paid tier)
    // In a real app, this would check for credits or subscription status.
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. A geração de arte está disponível apenas para usuários Pro (Admin).' });
    }

    // 2. Perplexity (Cérebro) - Server Side
    console.log("1. Chamando Perplexity...");
    const pplxResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          { 
            role: "system", 
            content: "You are a Pro 3D Art Director. Create a highly detailed prompt for a commercial flyer background. Focus on Octane Render, Unreal Engine 5, Volumetric Lighting and negative space for text." 
          },
          { 
            role: "user", 
            content: `Business: ${promptInfo.companyName}. Details: ${promptInfo.details}. Style: Premium 3D Advertising.` 
          }
        ]
      })
    });
    const pplxData = await pplxResponse.json();
    const refinedPrompt = pplxData.choices?.[0]?.message?.content || promptInfo.details;

    // 3. Freepik (Visual) - Server Side
    console.log("2. Chamando Freepik...");
    const styleSuffix = "commercial flyer background, 3d render, octane render, 8k, highly detailed, studio lighting, no text";
    const freepikResponse = await fetch("https://api.freepik.com/v1/ai/text-to-image", {
      method: "POST",
      headers: {
        "x-freepik-api-key": process.env.FREEPIK_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: `${refinedPrompt}, ${styleSuffix}`,
        num_images: 1,
        image: { size: "portrait_4_3" },
        styling: { style: "digital_art", color: "vibrant", lighting: "studio" }
      })
    });

    const freepikData = await freepikResponse.json();
    if (!freepikData.data || !freepikData.data[0]) {
      throw new Error("Falha ao gerar imagem no Freepik");
    }
    const base64Image = freepikData.data[0].base64;

    // 4. Upload para Supabase Storage
    console.log("3. Salvando no Storage...");
    const buffer = Buffer.from(base64Image, 'base64');
    const fileName = `${user.id}/${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('generated-arts')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

    if (uploadError) throw uploadError;

    // Gerar URL Pública
    const { data: { publicUrl } } = supabase.storage
      .from('generated-arts')
      .getPublicUrl(fileName);

    // 5. Salvar Metadados no Banco
    console.log("4. Salvando Metadados...");
    const { data: dbData, error: dbError } = await supabase
      .from('images')
      .insert({
        user_id: user.id,
        prompt: refinedPrompt,
        image_url: publicUrl,
        business_info: promptInfo
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 6. Retornar Sucesso
    res.json({ success: true, image: dbData });

  } catch (error) {
    console.error("Erro no Backend:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Seguro rodando na porta ${PORT}`);
});