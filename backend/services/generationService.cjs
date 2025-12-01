// backend/services/generationService.cjs
const { supabaseService, imageModel, FREE_LIMIT, STARTER_LIMIT, PRO_LIMIT } = require('../config');
const { v4: uuidv4 } = require('uuid');

/**
 * Checks the user's current quota and increments the usage count if allowed.
 * @param {string} userId - The ID of the user.
 */
const checkAndIncrementQuota = async (userId) => {
    // 1. Get user role from profiles
    const { data: profileData, error: profileError } = await supabaseService
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
    if (profileError || !profileData) {
        throw new Error('User profile not found or failed to retrieve role.');
    }
    
    const role = profileData.role;

    // 2. Get current usage from user_usage
    const { data: usageData, error: usageError } = await supabaseService
        .from('user_usage')
        .select('current_usage')
        .eq('user_id', userId)
        .single();
        
    if (usageError || !usageData) {
        // Assume 0 usage if record is missing (should be handled by trigger, but safe fallback)
        console.warn(`User ${userId} missing user_usage record. Assuming 0.`);
        usageData.current_usage = 0;
    }

    const usage_count = usageData.current_usage;
    let limit = 0;
    let isUnlimited = false;

    switch (role) {
        case 'owner':
        case 'dev':
        case 'admin':
            isUnlimited = true;
            break;
        case 'pro':
            limit = PRO_LIMIT; 
            break;
        case 'starter':
            limit = STARTER_LIMIT;
            break;
        case 'free':
        default:
            limit = FREE_LIMIT;
            break;
    }

    // 3. Check Quota
    if (!isUnlimited && usage_count >= limit) {
        throw new Error(`Quota Reached. Current usage: ${usage_count}/${limit}. Faça upgrade para continuar.`);
    }

    // 4. Increment Usage Count (using RPC function for safety)
    if (!isUnlimited) {
        const { error: rpcError } = await supabaseService
            .rpc('increment_user_usage', { user_id_input: userId });

        if (rpcError) {
            console.error('Failed to increment usage count:', rpcError);
            throw new Error('Falha ao registrar o uso da imagem.');
        }
    }
    
    return { role, usage_count, limit, isUnlimited };
};

/**
 * Initiates the image generation process asynchronously.
 * @param {string} jobId - The ID of the job (used for file path and job update).
 * @param {string} userId - The ID of the user (CRITICAL FIX: used for RLS and ownership).
 * @param {object} promptInfo - The prompt information object.
 */
const processImageGeneration = async (jobId, userId, promptInfo) => {
    const prompt = `Generate a high-quality, professional image for a business based on this description: "${promptInfo.details}". The image should be suitable for a website banner or social media profile.`;

    // Status inicial é PENDING, mas o job já foi criado no router.
    let imagePath = null;
    let status = 'FAILED';
    let errorMessage = null;

    try {
        // 1. Call Gemini API for image generation using the shared imageModel
        const response = await imageModel.generateContent({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '3:4', // Usando 3:4 vertical conforme o frontend espera
            },
        });

        const imageBase64 = response.generatedImages[0].image.imageBytes;

        // 2. Upload to Supabase Storage
        // CRITICAL FIX: Using userId in the path for RLS security
        const filePath = `${userId}/${jobId}.jpeg`; 
        
        const { data: uploadData, error: uploadError } = await supabaseService.storage
            .from('generated-arts')
            .upload(filePath, Buffer.from(imageBase64, 'base64'), {
                contentType: 'image/jpeg',
            });

        if (uploadError) {
            console.error('Image upload failed:', uploadError);
            throw new Error('Falha ao fazer upload da imagem para o armazenamento.');
        }

        imagePath = uploadData.path;
        status = 'COMPLETE';
        
        // 3. Save the final image record in the 'images' table
        const { error: imageInsertError } = await supabaseService
            .from('images')
            .insert({
                user_id: userId, // CRITICAL FIX: Correct user_id
                prompt: prompt,
                image_url: imagePath,
                business_info: promptInfo, // Saving the full business info object
            });
            
        if (imageInsertError) {
            console.error('Failed to insert into images table:', imageInsertError);
            errorMessage = 'Falha ao registrar a imagem no histórico.';
            status = 'FAILED';
        }

    } catch (error) {
        console.error('Image generation failed:', error.message);
        errorMessage = error.message;
        status = 'FAILED';
    } finally {
        // 4. Update job status in database
        const updatePayload = { 
            status, 
            image_url: imagePath, 
            error_message: errorMessage 
        };
        
        const { error: updateError } = await supabaseService
            .from('generation_jobs')
            .update(updatePayload)
            .eq('id', jobId);

        if (updateError) {
            console.error('Database job update failed:', updateError);
        }
    }
};

/**
 * Retrieves the status and image path of a specific job.
 * @param {string} jobId - The ID of the job.
 * @returns {Promise<{status: string, image_path: string | null, error_message: string | null}>} - Job details.
 */
const getJobStatus = async (jobId) => {
    const { data, error } = await supabaseService
        .from('generation_jobs')
        .select('status, image_url, error_message')
        .eq('id', jobId)
        .single();

    if (error || !data) {
        throw new Error('Trabalho não encontrado ou erro de banco de dados.');
    }

    return { status: data.status, image_path: data.image_url, error_message: data.error_message };
};

module.exports = {
    processImageGeneration,
    checkAndIncrementQuota,
    getJobStatus,
};