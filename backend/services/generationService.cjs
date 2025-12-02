const { supabaseService, imageModel } = require('../config');

const generateImageWithQuotaCheck = async (userId, promptInfo) => {
  // 1. Get user's active subscription and quota
  const { data: subscription, error: subError } = await supabaseService
    .from('subscriptions')
    .select(`
      status,
      plans ( name, image_quota )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (subError || !subscription) {
    // Create free subscription if none exists
    const { data: freePlan } = await supabaseService
      .from('plans')
      .select('id')
      .eq('name', 'Free')
      .single();
    
    if (freePlan) {
      await supabaseService
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: freePlan.id,
          status: 'active'
        });
    }
  }

  const quotaLimit = subscription?.plans?.image_quota || 3;

  // 2. Count images generated this month
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const { count: imagesGenerated, error: countError } = await supabaseService
    .from('image_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (countError) {
    throw new Error("Erro ao verificar o uso de imagens.");
  }

  // 3. Check quota
  if (imagesGenerated >= quotaLimit) {
    const error = new Error(`Quota excedida. Limite do plano "${subscription?.plans?.name || 'Free'}": ${quotaLimit} imagens.`);
    error.code = 'QUOTA_EXCEEDED';
    throw error;
  }

  // 4. Generate detailed prompt
  const detailedPrompt = `
    Crie um flyer profissional e atraente com o seguinte briefing:
    Nome da Empresa: ${promptInfo.companyName}
    Telefone: ${promptInfo.phone}
    Endereço: ${promptInfo.addressStreet}, ${promptInfo.addressNumber} - ${promptInfo.addressNeighborhood}, ${promptInfo.addressCity}
    Detalhes do Serviço/Promoção: ${promptInfo.details}
    
    Instruções de Design:
    - Layout vertical (3:4)
    - Estilo profissional, moderno e com alta qualidade visual
    - Cores vibrantes e atraentes
    - Tipografia clara e legível
    - Incluir todos os dados fornecidos de forma organizada
    - Foco em conversão e impacto visual
  `;

  try {
    // 5. Generate image with Gemini
    const result = await imageModel.generateContent([
      {
        text: detailedPrompt
      }
    ]);
    
    const imageBase64 = result.response.candidates[0].content.parts[0].inlineData.data;
    const mimeType = result.response.candidates[0].content.parts[0].inlineData.mimeType;

    // 6. Save to Supabase Storage
    const fileName = `${userId}/${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from('generated-arts')
      .upload(fileName, Buffer.from(imageBase64, 'base64'), {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error("Erro ao fazer upload da imagem:", uploadError);
      throw new Error("Falha ao salvar a imagem gerada.");
    }

    // 7. Get public URL
    const { data: { publicUrl } } = supabaseService.storage
      .from('generated-arts')
      .getPublicUrl(fileName);

    // 8. Register generation
    await supabaseService
      .from('image_generations')
      .insert({
        user_id: userId
      });

    // 9. Save image record
    const { data: imageData, error: imageInsertError } = await supabaseService
      .from('images')
      .insert({
        user_id: userId,
        prompt: detailedPrompt,
        image_url: fileName,
        business_info: promptInfo
      })
      .select()
      .single();

    if (imageInsertError) {
      console.error("Erro ao registrar imagem:", imageInsertError);
    }

    return {
      id: imageData?.id || `temp-${Date.now()}`,
      url: publicUrl,
      prompt: detailedPrompt,
      businessInfo: promptInfo,
      createdAt: new Date().toISOString(),
    };
  } catch (geminiError) {
    console.error("Erro na API do Gemini:", geminiError);
    throw new Error("Falha ao gerar a imagem com a inteligência artificial.");
  }
};

module.exports = {
  generateImageWithQuotaCheck
};