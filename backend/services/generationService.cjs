// backend/services/generationService.cjs
const { supabaseService, imageModel } = require('../config'); // Usar service key para operações no DB

/**
 * Verifica a quota, gera uma imagem e registra o uso.
 * @param {string} userId - O ID do usuário.
 * @param {object} promptInfo - O objeto com informações do negócio.
 * @returns {Promise<object>} O objeto da imagem gerada.
 */
const generateImageWithQuotaCheck = async (userId, promptInfo) => {
  // 1. Buscar a assinatura ativa do usuário e a quota do plano associado
  const { data: subscription, error: subError } = await supabaseService
    .from('subscriptions')
    .select(`
      status,
      plans (
        name,
        image_quota
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (subError || !subscription) {
    throw new Error("Assinatura ativa não encontrada.");
  }

  const quotaLimit = subscription.plans.image_quota;

  // 2. Contar quantas imagens o usuário já gerou este mês
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

  // 3. Validar a quota
  if (imagesGenerated >= quotaLimit) {
    const error = new Error(`Quota excedida. Limite do plano "${subscription.plans.name}": ${quotaLimit} imagens.`);
    error.code = 'QUOTA_EXCEEDED';
    throw error;
  }

  // 4. Se a quota estiver OK, gerar o prompt detalhado
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
    - Se houver logo, integrá-lo de forma harmônica (logo fornecido como base64)
    - Foco em conversão e impacto visual
  `;

  // 5. Chamar a API do Google AI Studio (Gemini) para gerar a imagem
  try {
    const result = await imageModel.generateContent([
      {
        text: detailedPrompt
      }
    ]);

    const imageBase64 = result.response.candidates[0].content.parts[0].inlineData.data;
    const mimeType = result.response.candidates[0].content.parts[0].inlineData.mimeType;

    // 6. Salvar a imagem no storage do Supabase
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

    // 7. Obter a URL pública da imagem
    const { data: { publicUrl } } = supabaseService.storage
      .from('generated-arts')
      .getPublicUrl(fileName);

    // 8. Registrar a geração no banco de dados
    const { error: insertError } = await supabaseService
      .from('image_generations')
      .insert({
        user_id: userId
      });

    if (insertError) {
      // Logar o erro mas não falhar a requisição, pois a imagem já foi gerada
      console.error(`Falha ao registrar uso para o usuário ${userId}:`, insertError);
    }

    // 9. Registrar a imagem na tabela 'images' para histórico
    const { data: imageData, error: imageInsertError } = await supabaseService
      .from('images')
      .insert({
        user_id: userId,
        prompt: detailedPrompt,
        image_url: fileName, // Armazenar o caminho do arquivo
        business_info: promptInfo
      })
      .select()
      .single();

    if (imageInsertError) {
      console.error("Erro ao registrar imagem na tabela 'images':", imageInsertError);
      // Mesmo que falhe, retornamos a imagem gerada
    }

    return {
      id: imageData?.id || 'temp-id',
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