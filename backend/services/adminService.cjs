// backend/services/adminService.cjs
const { supabaseService } = require('../config');
const { v4: uuidv4 } = require('uuid'); // Importando uuid

/**
 * Uploads a base64 encoded image to Supabase Storage and records it in the database.
 * @param {string} fileBase64 - The base64 string of the file, potentially including the MIME prefix.
 * @param {string} fileName - The original file name.
 * @param {string} userId - The ID of the user performing the upload (admin/dev).
 * @returns {Promise<object>} The created LandingImage object.
 */
const uploadLandingImage = async (fileBase64, fileName, userId) => {
    try {
        // 1. Limpeza e Decodificação Base64
        // Remove o prefixo MIME (ex: data:image/png;base64,)
        const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Determina a extensão do arquivo
        const mimeMatch = fileBase64.match(/^data:(.+);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const extension = mimeType.split('/')[1] || 'jpg';

        // 2. Geração de Nome Único e Caminho
        const uniqueFileName = `${uuidv4()}.${extension}`;
        const storagePath = `landing-images/${uniqueFileName}`;
        const bucketName = 'generated-arts'; // Assumindo que o bucket é o mesmo

        // 3. Upload para Supabase Storage
        const { error: uploadError } = await supabaseService.storage
            .from(bucketName)
            .upload(storagePath, buffer, {
                contentType: mimeType,
                upsert: false, // Não sobrescreve
            });

        if (uploadError) {
            console.error("Supabase Storage Upload Error:", uploadError);
            throw new Error(`Falha no upload para o Storage: ${uploadError.message}`);
        }

        // 4. Inserção no Banco de Dados
        const { data: { publicUrl } } = supabaseService.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

        const { data: imageRecord, error: dbError } = await supabaseService
            .from('landing_images')
            .insert([
                { 
                    user_id: userId, 
                    image_path: storagePath, // Armazena o caminho interno
                    url: publicUrl, // Armazena a URL pública
                    is_active: true,
                }
            ])
            .select()
            .single();

        if (dbError) {
            // Tenta deletar o arquivo do storage se a inserção no DB falhar
            await supabaseService.storage.from(bucketName).remove([storagePath]);
            console.error("Supabase DB Insert Error:", dbError);
            throw new Error(`Falha ao registrar imagem no DB: ${dbError.message}`);
        }

        return imageRecord;

    } catch (error) {
        console.error("CRITICAL ADMIN UPLOAD ERROR:", error);
        // Re-lança o erro para ser capturado pelo handler da rota
        throw new Error(error.message || "Erro desconhecido no serviço de upload.");
    }
};

/**
 * Fetches all active landing images.
 * @returns {Promise<object[]>} List of active landing images.
 */
const fetchLandingImages = async () => {
    const { data, error } = await supabaseService
        .from('landing_images')
        .select('id, url, image_path, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Deletes a landing image from the database and storage.
 * @param {string} id - The ID of the image record in the database.
 * @param {string} imagePath - The path of the image in Supabase Storage.
 */
const deleteLandingImage = async (id, imagePath) => {
    const bucketName = 'generated-arts';

    // 1. Deleta do Storage
    const { error: storageError } = await supabaseService.storage
        .from(bucketName)
        .remove([imagePath]);

    if (storageError) {
        console.error("Supabase Storage Delete Error:", storageError);
        // Não lançamos erro aqui, pois a exclusão do DB é mais crítica
    }

    // 2. Deleta do Banco de Dados
    const { error: dbError } = await supabaseService
        .from('landing_images')
        .delete()
        .eq('id', id);

    if (dbError) {
        console.error("Supabase DB Delete Error:", dbError);
        throw new Error(`Falha ao deletar registro no DB: ${dbError.message}`);
    }
};

module.exports = {
    uploadLandingImage,
    fetchLandingImages,
    deleteLandingImage,
};