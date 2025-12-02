// backend/services/generationService.cjs
const { supabaseService, imageModel } = require('../config'); // Usar service key para operações no DB

/**
 * Verifica a quota, gera uma imagem e registra o uso.
 * @param {string} userId - O ID do usuário.
 * @param {string} promptText - O prompt para a IA.
 * @returns {Promise<object>} O objeto da imagem gerada.
 */
const generateImageWithQuotaCheck = async (userId, promptText) => {
    // 1. Buscar a assinatura ativa do usuário e a quota do plano associado
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
        throw new Error("Assinatura ativa não encontrada.");
    }

    const quotaLimit = subscription.plans.image_quota;

    // 2. Contar quantas imagens o usuário já gerou
    const { count: imagesGenerated, error: countError } = await supabaseService
        .from('image_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (countError) {
        throw new Error("Erro ao verificar o uso de imagens.");
    }

    // 3. Validar a quota
    if (imagesGenerated >= quotaLimit) {
        const error = new Error(`Quota excedida. Limite do plano "${subscription.plans.name}": ${quotaLimit} imagens.`);
        error.code = 'QUOTA_EXCEEDED';
        throw error;
    }

    // 4. Se a quota estiver OK, gerar a imagem (simulação da chamada à IA)
    // Em um cenário real, aqui estaria a chamada para o Google AI Studio
    const response = await imageModel.generateContent({
        model: 'imagen-3.0-generate-02', // Exemplo de modelo
        prompt: `Flyer profissional para: ${promptText}`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '3:4',
        },
    });
    const imageBase64 = response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`; // Exemplo de URL

    // 5. Registrar o novo uso no banco de dados
    const { error: insertError } = await supabaseService
        .from('image_generations')
        .insert({ user_id: userId });

    if (insertError) {
        // Logar o erro mas não falhar a requisição, pois a imagem já foi gerada
        console.error(`Falha ao registrar uso para o usuário ${userId}:`, insertError);
    }

    return {
        url: imageUrl,
        prompt: promptText,
        createdAt: new Date().toISOString(),
    };
};

module.exports = {
    generateImageWithQuotaCheck,
};