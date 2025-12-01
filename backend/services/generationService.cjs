// backend/services/generationService.cjs
const { GoogleGenAI } = require('@google/genai');
const { supabaseService, GEMINI_API_KEY, FREE_LIMIT, STARTER_LIMIT } = require('../config');

const ai = new GoogleGenAI(GEMINI_API_KEY);

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
        case 'admin': // Adicionando admin
            isUnlimited = true;
            break;
        case 'pro': // Assumindo que 'pro' é o plano de maior limite
            limit = 50; // Usando um limite alto para 'pro'
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
        throw new Error(`Quota Reached. Current usage: ${usage_count}/${limit}. Please upgrade your plan.`);
    }

    // 4. Increment Usage Count (using RPC function for safety)
    if (!isUnlimited) {
        const { error: rpcError } = await supabaseService
            .rpc('increment_user_usage', { user_id_input: userId });

        if (rpcError) {
            console.error('Failed to increment usage count:', rpcError);
            throw new Error('Failed to update user quota.');
        }
    }
    
    // Return the role for consistency, although not strictly needed here
    return { role, usage_count, limit, isUnlimited };
};

/**
 * Initiates the image generation process asynchronously.
 * @param {string} userId - The ID of the user.
 * @param {string} businessInfo - The prompt for the image generation.
 * @returns {Promise<{jobId: string, status: string}>} - The ID and initial status of the job.
 */
const processImageGeneration = async (userId, businessInfo) => {
    const prompt = `Generate a high-quality, professional image for a business based on this description: "${businessInfo}". The image should be suitable for a website banner or social media profile.`;

    // 1. Create a new job entry in the database (status: PENDING)
    const { data: jobData, error: jobError } = await supabaseService
        .from('generation_jobs') // Usando a tabela existente 'generation_jobs'
        .insert({ user_id: userId, prompt_info: { details: businessInfo }, status: 'PENDING' }) // Ajustando para o schema de generation_jobs
        .select('id')
        .single();

    if (jobError || !jobData) {
        console.error('Failed to create image job:', jobError);
        throw new Error('Failed to initialize image generation job.');
    }

    const jobId = jobData.id;

    // 2. Asynchronously call the AI model and update the job status
    (async () => {
        let imagePath = null;
        let status = 'FAILED';

        try {
            // 3. Call Gemini API for image generation
            const response = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });

            // NOTE: The Gemini SDK returns imageBytes as base64 string
            const imageBase64 = response.generatedImages[0].image.imageBytes;

            // 4. Upload to Supabase Storage
            const filePath = `${userId}/${jobId}.jpeg`; // Usando o ID do job como nome do arquivo
            
            const { data: uploadData, error: uploadError } = await supabaseService.storage
                .from('generated-arts')
                .upload(filePath, Buffer.from(imageBase64, 'base64'), {
                    contentType: 'image/jpeg',
                });

            if (uploadError) {
                console.error('Image upload failed:', uploadError);
                throw new Error('Failed to upload image to storage.');
            }

            imagePath = uploadData.path;
            status = 'COMPLETE';
            
            // 5. Save the final image record in the 'images' table (as per original schema)
            const { error: imageInsertError } = await supabaseService
                .from('images')
                .insert({
                    user_id: userId,
                    prompt: prompt,
                    image_url: imagePath,
                    business_info: { details: businessInfo }, // Simplified business info
                });
                
            if (imageInsertError) {
                console.error('Failed to insert into images table:', imageInsertError);
                // Continue to update job status even if image insert fails
            }

            // 6. Update job status in database with the image path
            const { error: updateError } = await supabaseService
                .from('generation_jobs')
                .update({ status, image_url: imagePath })
                .eq('id', jobId);

            if (updateError) {
                console.error('Database update failed:', updateError);
                // Do not rethrow here, as this is an async background process
            }
        } catch (error) {
            console.error('Image generation failed:', error);
            // Set status to FAILED in the database
            await supabaseService.from('generation_jobs').update({ status: 'FAILED', error_message: error.message }).eq('id', jobId);
        }
    })();

    return { jobId, status: 'PENDING' };
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
        throw new Error('Job not found or database error.');
    }

    return { status: data.status, image_path: data.image_url, error_message: data.error_message };
};

module.exports = {
    processImageGeneration,
    checkAndIncrementQuota,
    getJobStatus,
};