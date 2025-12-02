const { supabaseService, imageModel } = require('../config');

const generateImageWithQuotaCheck = async (userId, promptInfo) => {
  console.log('🎨 Starting image generation for user:', userId);

  // 1. Get user's profile and subscription
  const { data: profile, error: profileError } = await supabaseService
    .from('profiles')
    .select('role, status')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError);
    throw new Error('Perfil do usuário não encontrado.');
  }

  if (profile.status !== 'on') {
    throw new Error('Sua conta está pausada. Entre em contato com o suporte.');
  }

  // 2. Get quota based on role
  let quotaLimit = 3; // Free default
  let isUnlimited = false;

  switch (profile.role) {
    case 'owner':
    case 'dev':
    case 'admin':
      isUnlimited = true;
      break;
    case 'pro':
      quotaLimit = 50;
      break;
    case 'starter':
      quotaLimit = 20;
      break;
    case 'free':
    default:
      quotaLimit = 3;
      break;
  }

  // 3. Check current usage (only if not unlimited)
  if (!isUnlimited) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { count: imagesGenerated, error: countError } = await supabaseService
      .from('image_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (countError) {
      console.error('Usage count error:', countError);
      throw new Error('Erro ao verificar seu uso de imagens.');
    }

    if (imagesGenerated >= quotaLimit) {
      const error = new Error(`Você atingiu seu limite de ${quotaLimit} imagens este mês. Faça upgrade para continuar gerando!`);
      error.code = 'QUOTA_EXCEEDED';
      throw error;
    }

    console.log(`User ${userId} has used ${imagesGenerated}/${quotaLimit} images`);
  }

  // 4. Generate detailed prompt
  const detailedPrompt = `
Crie um flyer profissional e atraente para uma empresa com as seguintes informações:

NOME DA EMPRESA: ${promptInfo.companyName}
TELEFONE/WHATSAPP: ${promptInfo.phone}
ENDEREÇO: ${promptInfo.addressStreet}, ${promptInfo.addressNumber} - ${promptInfo.addressNeighborhood}, ${promptInfo.addressCity}
SERVIÇOS/PROMOÇÃO: ${promptInfo.details}

INSTRUÇÕES DE DESIGN:
- Formato: Retrato (9:16) ideal para stories e redes sociais
- Estilo: Profissional, moderno e limpo
- Cores: Use cores vibrantes mas profissionais
- Tipografia: Clara, legível e hierárquica
- Layout: Bem organizado com espaçamento adequado
- Elementos: Incluir todos os dados fornecidos de forma visível
- Foco: Destaque os principais serviços/promoções
- Qualidade: Alta resolução, aparência premium

O flyer deve ser visualmente impactante e profissional, adequado para marketing digital.
  `.trim();

  try {
    console.log('🤖 Calling Gemini API...');
    
    // 5. Generate image with Gemini
    const result = await imageModel.generateContent([
      {
        text: detailedPrompt
      }
    ]);
    
    const response = result.response;
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('A IA não conseguiu gerar a imagem. Tente novamente.');
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Resposta inválida da API Gemini.');
    }

    const imageData = candidate.content.parts[0].inlineData;
    if (!imageData || !imageData.data) {
      throw new Error('A imagem não foi gerada corretamente.');
    }

    const imageBase64 = imageData.data;
    const mimeType = imageData.mimeType || 'image/png';

    console.log('✅ Image generated successfully, size:', imageBase64.length);

    // 6. Save to Supabase Storage
    const fileName = `${userId}/${Date.now()}.png`;
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from('generated-arts')
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Falha ao salvar a imagem gerada.');
    }

    console.log('✅ Image uploaded to storage:', fileName);

    // 7. Get public URL
    const { data: { publicUrl } } = supabaseService.storage
      .from('generated-arts')
      .getPublicUrl(fileName);

    // 8. Register generation in database
    const { error: genError } = await supabaseService
      .from('image_generations')
      .insert({
        user_id: userId
      });

    if (genError) {
      console.error('Generation registration error:', genError);
      // Don't throw error here, image was generated successfully
    }

    // 9. Save image record
    const { data: imageDataRecord, error: imageInsertError } = await supabaseService
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
      console.error('Image record error:', imageInsertError);
      // Don't throw error here, image was generated successfully
    }

    console.log('✅ Image generation completed successfully');

    return {
      id: imageDataRecord?.id || `temp-${Date.now()}`,
      url: publicUrl,
      prompt: detailedPrompt,
      businessInfo: promptInfo,
      createdAt: new Date().toISOString(),
    };

  } catch (geminiError) {
    console.error('❌ Gemini API error:', geminiError);
    
    if (geminiError.message.includes('quota')) {
      throw new Error('Cota da API Gemini excedida. Tente novamente mais tarde.');
    } else if (geminiError.message.includes('invalid')) {
      throw new Error('Prompt inválido. Verifique as informações fornecidas.');
    } else if (geminiError.message.includes('safety')) {
      throw new Error('O conteúdo viola as políticas de segurança da IA.');
    }
    
    throw new Error('Falha ao gerar a imagem com a inteligência artificial. Tente novamente.');
  }
};

module.exports = {
  generateImageWithQuotaCheck
};