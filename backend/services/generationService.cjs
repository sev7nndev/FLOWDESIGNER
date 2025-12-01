const { supabaseService, imageModel } = require('../config');
const { v4: uuidv4 } = require('uuid');

// --- Funções de Quota e Uso ---

async function checkImageQuota(userId) {
    const { data: usageData, error: usageError } = await supabaseService
        .from('user_usage')
        .select('current_usage, plan_id, plans:plan_id(max_images_per_month)')
        .eq('user_id', userId)
        .single();

    if (usageError || !usageData) {
        console.error("Quota check failed:", usageError?.message);
        // Se falhar, assumimos o plano free padrão para evitar bloqueio total
        return { status: 'OK', message: 'Falha ao verificar o plano de uso, assumindo Free.', currentUsage: 0, maxQuota: 3, planId: 'free' };
    }

    const maxQuota = usageData.plans?.max_images_per_month || 0;
    const currentUsage = usageData.current_usage || 0;
    const planId = usageData.plan_id;

    // Admin/Devs têm uso ilimitado
    if (planId === 'admin' || planId === 'dev' || maxQuota === 0) {
        return { status: 'OK', message: 'Uso ilimitado.', currentUsage, maxQuota, planId };
    }

    if (currentUsage >= maxQuota) {
        return { 
            status: 'BLOCKED', 
            message: `Você atingiu o limite de ${maxQuota} gerações para o seu plano (${planId}). Faça upgrade para continuar.`,
            currentUsage, maxQuota, planId
        };
    }

    return { status: 'OK', message: 'Geração permitida.', currentUsage, maxQuota, planId };
}

async function incrementUsage(userId) {
    const { error } = await supabaseService
        .rpc('increment_user_usage', { user_id_input: userId });

    if (error) {
        console.error(`Falha ao incrementar o uso para o usuário ${userId}:`, error);
        throw new Error('Falha ao registrar o uso da imagem.');
    }
}

// --- Função de Construção do Prompt ---

function constructFinalImagePrompt(businessInfo) {
    const { companyName, phone, addressStreet, addressNumber, addressNeighborhood, addressCity, details } = businessInfo;
    
    const servicesList = details.split('.').map(s => s.trim()).filter(s => s.length > 0).join('; ');
    
    const address = [addressStreet, addressNumber, addressNeighborhood, addressCity]
        .filter(Boolean)
        .join(', ');

    const finalPrompt = `Você é um designer profissional de social media. Gere uma arte de FLYER VERTICAL em alta qualidade, com aparência profissional.
    Use como referência o nível de qualidade de flyers modernos de pet shop, oficina mecânica, barbearia, lanchonete, salão de beleza, imobiliária e clínica, com:
    - composição bem organizada;
    - tipografia clara e hierarquia entre título, subtítulo e lista de serviços;
    - ilustrações ou imagens relacionadas ao nicho;
    - fundo bem trabalhado, mas sem poluir o texto.
    Nicho do cliente: ${details}.
    Dados que DEVEM aparecer no flyer:
    - Nome da empresa: ${companyName}
    - Serviços principais: ${servicesList}
    - Telefone/WhatsApp: ${phone}
    - Endereço (se houver): ${address}
    Diretrizes de design:
    - Usar cores coerentes com o nicho (ex.: suaves para pet shop/saúde; escuras e fortes para mecânica/barbearia; quentes para lanchonete etc.).
    - Reservar espaço para o logotipo.
    - Não inventar textos aleatórios; use somente os dados fornecidos.`;

    return finalPrompt;
}

// --- Função de Geração de Imagem (Orquestrador) ---

const processImageGeneration = async (jobId, userId, promptInfo) => {
    console.log(`[JOB ${jobId}] Iniciando processamento para o usuário ${userId}...`);
    
    const updateJobStatus = async (status, data = {}) => {
        const { error } = await supabaseService
            .from('generation_jobs')
            .update({ status, ...data, updated_at: new Date().toISOString() })
            .eq('id', jobId);
        if (error) {
            console.error(`[JOB ${jobId}] Falha ao atualizar o status para ${status}:`, error);
        }
    };

    try {
        // 1. Quota Check (Segurança extra)
        const quotaStatus = await checkImageQuota(userId);
        if (quotaStatus.status === 'BLOCKED') {
            throw new Error(quotaStatus.message);
        }

        // 2. Construção do Prompt Final
        const finalPrompt = constructFinalImagePrompt(promptInfo);

        // 3. Geração da Imagem (Gemini Image API)
        let imageBase64;
        try {
            const imageResult = await imageModel.generateContent({
                model: 'imagen-3.0-generate-002',
                prompt: finalPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '3:4', // Vertical Flyer
                },
            });
            
            if (!imageResult.generatedImages || imageResult.generatedImages.length === 0) {
                throw new Error('A IA não conseguiu gerar a imagem com o prompt fornecido.');
            }
            
            imageBase64 = imageResult.generatedImages[0].image.imageBytes;
        } catch (geminiError) {
            console.error(`[JOB ${jobId}] Erro na API Gemini Image:`, geminiError);
            throw new Error('Falha na geração da imagem pela IA. Tente refinar o briefing.');
        }

        // 4. Upload e Registro no DB
        let imagePath;
        let publicUrl;
        try {
            // 4a. Upload da imagem (Base64 para Buffer)
            const imageBuffer = Buffer.from(imageBase64, 'base64');
            const filePath = `${userId}/${uuidv4()}.jpeg`;
            
            const { data: uploadData, error: uploadError } = await supabaseService.storage
                .from('generated-arts') // Usando o bucket existente
                .upload(filePath, imageBuffer, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (uploadError) throw uploadError;
            imagePath = uploadData.path;

            // 4b. Salva o registro na tabela 'images'
            const { data: imageRecord, error: dbError } = await supabaseService
                .from('images')
                .insert({
                    user_id: userId,
                    prompt: finalPrompt, // Salva o prompt final detalhado
                    image_url: imagePath,
                    business_info: promptInfo,
                })
                .select()
                .single();

            if (dbError) throw dbError;
            
            // 4c. Incrementa o uso APÓS o sucesso total
            await incrementUsage(userId);
            
            // 4d. Obtém URL pública (para retornar ao frontend)
            const { data: urlData } = supabaseService.storage
                .from('generated-arts')
                .getPublicUrl(imagePath);
            
            publicUrl = urlData.publicUrl;

            // 5. Sucesso: Atualiza o status do trabalho
            await updateJobStatus('COMPLETED', { image_url: publicUrl });
            console.log(`[JOB ${jobId}] Processamento concluído com sucesso. Path: ${imagePath}`);

        } catch (dbError) {
            console.error(`[JOB ${jobId}] Erro no Supabase (Upload/DB/Incremento):`, dbError);
            throw new Error('Falha ao salvar a imagem ou registrar o uso.');
        }

    } catch (error) {
        // 6. Falha: Atualiza o status do trabalho com a mensagem de erro
        const errorMessage = error.message || 'Erro desconhecido durante o processamento.';
        await updateJobStatus('FAILED', { error_message: errorMessage });
        console.error(`[JOB ${jobId}] Processamento falhou:`, errorMessage);
    }
};

module.exports = {
    checkImageQuota,
    processImageGeneration,
    incrementUsage,
    constructFinalImagePrompt,
};