const { supabaseService, imageModel } = require('../config');

const generateImageWithQuotaCheck = async (userId, promptInfo) => {
  console.log('🎨 Starting image generation for user:', userId);

  try {
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

    // 5. Generate image with Google AI Studio
    console.log('🤖 Calling Google AI Studio API...');
    
    const result = await imageModel.generateContent([
      {
        text: detailedPrompt
      }
    ]);
    
    console.log('🔍 Gemini response received, validating...');
    
    const response = result.response;
    if (!response.candidates || response.candidates.length === 0) {
      console.error('❌ No candidates in Gemini response');
      throw new Error('A IA não conseguiu gerar a imagem. Tente novamente.');
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('❌ Invalid candidate structure:', candidate);
      throw new Error('Resposta inválida da API Gemini.');
    }

    const imageData = candidate.content.parts[0].inlineData;
    if (!imageData || !imageData.data) {
      console.error('❌ No image data in response');
      throw new Error('A imagem não foi gerada corretamente.');
    }

    const imageBase64 = imageData.data;
    const mimeType = imageData.mimeType || 'image/png';

    console.log('✅ Image generated successfully, size:', imageBase64.length);

    // 6. Validate and convert base64 to Buffer
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error('Dados da imagem inválidos.');
    }

    let imageBuffer;
    try {
      imageBuffer = Buffer.from(imageBase64, 'base64');
      console.log('✅ Buffer created successfully, size:', imageBuffer.length);
    } catch (bufferError) {
      console.error('❌ Buffer creation error:', bufferError);
      throw new Error('Falha ao processar dados da imagem.');
    }

    // 7. Save to Supabase Storage using service role
    const fileName = `${userId}/${Date.now()}.png`;

    console.log('💾 Uploading to Supabase storage:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from('generated-arts')
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error('Falha ao salvar a imagem gerada: ' + uploadError.message);
    }

    console.log('✅ Image uploaded to storage:', fileName);

    // 8. Register generation in database
    const { error: genError } = await supabaseService
      .from('image_generations')
      .insert({
        user_id: userId
      });

    if (genError) {
      console.error('⚠️ Generation registration error:', genError);
      // Don't throw error, continue with image save
    }

    // 9. Update user usage count with better error handling
    if (!isUnlimited) {
      console.log('📊 Incrementing user usage...');
      try {
        const { error: usageError } = await supabaseService.rpc('increment_user_usage', {
          user_id_input: userId
        });

        if (usageError) {
          console.error('⚠️ Usage update error:', usageError);
          // Don't fail the whole process if usage update fails
          console.log('⚠️ Continuing without usage update...');
        } else {
          console.log('✅ Usage updated successfully');
        }
      } catch (rpcError) {
        console.error('⚠️ RPC call error:', rpcError);
        console.log('⚠️ Continuing without usage update...');
      }
    }

    // 10. Save image record
    console.log('💾 Saving image record...');
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
      console.error('❌ Image record error:', imageInsertError);
      throw new Error('Falha ao salvar registro da imagem: ' + imageInsertError.message);
    }

    console.log('✅ Image generation completed successfully');

    // 11. Get public URL
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