const { supabaseService, imageModel } = require('../config');

const generateImageWithQuotaCheck = async (userId, promptInfo) => {
  console.log('🎨 Starting image generation for user:', userId);

  // 1. Get user's profile and usage data
  const { data: usageData, error: usageError } = await supabaseService
    .from('user_usage')
    .select(`
      current_usage,
      profiles (role, status),
      plan_settings (max_images_per_month)
    `)
    .eq('user_id', userId)
    .single();

  if (usageError || !usageData || !usageData.profiles) {
    console.error('Usage/Profile fetch error:', usageError);
    throw new Error('Dados de uso ou perfil do usuário não encontrados.');
  }

  const profile = usageData.profiles;
  const currentUsage = usageData.current_usage || 0;
  
  if (profile.status !== 'on') {
    throw new Error('Sua conta está pausada. Entre em contato com o suporte.');
  }

  // 2. Determine limits
  let quotaLimit = (usageData.plan_settings && usageData.plan_settings.max_images_per_month) || 0;
  let isUnlimited = ['owner', 'dev', 'admin'].includes(profile.role);
  
  // Fallback for free plan if plan_settings is missing (shouldn't happen if seed data is run)
  if (profile.role === 'free' && quotaLimit === 0) {
      quotaLimit = 3;
  }
  
  // 3. Check quota
  if (!isUnlimited && currentUsage >= quotaLimit) {
    const error = new Error(`Você atingiu seu limite de ${quotaLimit} imagens este mês. Faça upgrade para continuar gerando!`);
    error.code = 'QUOTA_EXCEEDED';
    throw error;
  }

  console.log(`User ${userId} (Role: ${profile.role}) has used ${currentUsage}/${isUnlimited ? 'Unlimited' : quotaLimit} images`);

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
    console.log('🤖 Calling Google AI Studio API...');
    
    // 5. Generate image with Google AI Studio
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

    // 7. Register generation in database
    const { error: genError } = await supabaseService
      .from('image_generations')
      .insert({
        user_id: userId
      });

    if (genError) {
      console.error('Generation registration error:', genError);
      // Don't throw error here, image was generated successfully
    }

    // 8. Update user usage count (only if not unlimited)
    if (!isUnlimited) {
      const { error: usageError } = await supabaseService.rpc('increment_user_usage', {
        user_id_input: userId
      });

      if (usageError) {
        console.error('Usage update error:', usageError);
        // Don't throw error here, image was generated successfully
      }
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

    // 10. Get public URL
    const { data: { publicUrl } } = supabaseService.storage
      .from('generated-arts')
      .getPublicUrl(fileName);

    return {
      id: imageDataRecord?.id || `temp-${Date.now()}`,
      url: publicUrl,
      prompt: detailedPrompt,
      businessInfo: promptInfo,
      createdAt: new Date().toISOString(),
    };

  } catch (geminiError) {
    console.error('❌ Google AI Studio API error:', geminiError);
    
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