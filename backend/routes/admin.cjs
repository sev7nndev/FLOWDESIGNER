const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabaseServiceRole, supabaseAnon, FRONTEND_URL, MP_CLIENT_ID } = require('../config.cjs');
const { verifyAuth, authorizeAdmin } = require('../middleware/auth.cjs');

const router = express.Router();

// Rota Admin: Listar todas as imagens
router.get('/images', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!supabaseServiceRole) {
        return res.status(500).json({ error: 'Erro de configuração: Supabase Service Role Client ausente.' });
    }
    
    console.log(`Admin ${req.user.id} fetching all images.`);
    
    try {
        const { data, error } = await supabaseServiceRole
            .from('images')
            .select('id, user_id, prompt, image_url, business_info, created_at')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        res.json({ images: data });
    } catch (e) {
        console.error("Admin fetch all images failed:", e);
        res.status(500).json({ error: 'Failed to fetch all images.' });
    }
});

// Rota Admin: Deletar imagem
router.delete('/images/:imageId', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!supabaseServiceRole) {
        return res.status(500).json({ error: 'Erro de configuração: Supabase Service Role Client ausente.' });
    }
    
    const { imageId } = req.params;
    const { imageUrl } = req.body;
    
    console.log(`Admin ${req.user.id} deleting image ${imageId} at path ${imageUrl}.`);
    
    try {
        const { error: storageError } = await supabaseServiceRole.storage
            .from('images')
            .remove([imageUrl]);
            
        if (storageError && storageError.message !== 'The resource was not found') {
            console.warn("Storage deletion warning:", storageError.message);
        }
        
        const { error: dbError } = await supabaseServiceRole
            .from('images')
            .delete()
            .eq('id', imageId);
            
        if (dbError) throw dbError;
        
        res.status(200).json({ message: 'Image deleted successfully.' });
    } catch (e) {
        console.error("Admin delete image failed:", e);
        res.status(500).json({ error: 'Failed to delete image.' });
    }
});

// Rota Admin: Upload de imagem da Landing Page
router.post('/landing-images/upload', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!supabaseServiceRole || !supabaseAnon) {
        return res.status(500).json({ error: 'Erro de configuração: Supabase Client ausente.' });
    }
    
    const { fileBase64, fileName, userId } = req.body;
    
    if (!fileBase64 || !fileName) {
        return res.status(400).json({ error: "Missing file data." });
    }
    
    const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const fileExtension = fileName.split('.').pop();
    const storagePath = `landing-carousel/${uuidv4()}.${fileExtension}`;
    
    try {
        const { error: uploadError } = await supabaseServiceRole.storage
            .from('landing-carousel')
            .upload(storagePath, buffer, {
                contentType: `image/${fileExtension}`,
                upsert: false,
            });
            
        if (uploadError) throw uploadError;
        
        const { data: insertedImage, error: dbError } = await supabaseServiceRole
            .from('landing_carousel_images')
            .insert({
                image_url: storagePath,
                created_by: userId,
                sort_order: 0
            })
            .select('id, image_url, sort_order')
            .single();
            
        if (dbError) throw dbError;
        
        const { data: { publicUrl } } = supabaseAnon.storage
            .from('landing-carousel')
            .getPublicUrl(insertedImage.image_url);
            
        res.json({ 
            message: 'Upload successful',
            image: {
                id: insertedImage.id,
                url: publicUrl,
                sortOrder: insertedImage.sort_order
            }
        });
        
    } catch (e) {
        console.error("Admin landing image upload failed:", e);
        res.status(500).json({ error: e.message || 'Failed to upload landing image.' });
    }
});

// Rota Admin: Deletar imagem da Landing Page
router.delete('/landing-images/:id', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!supabaseServiceRole) {
        return res.status(500).json({ error: 'Erro de configuração: Supabase Service Role Client ausente.' });
    }
    
    const { id } = req.params;
    const { imagePath } = req.body;
    
    console.log(`Admin ${req.user.id} deleting landing image ${id} at path ${imagePath}.`);
    
    try {
        const { error: storageError } = await supabaseServiceRole.storage
            .from('landing-carousel')
            .remove([imagePath]);
            
        if (storageError && storageError.message !== 'The resource was not found') {
            console.warn("Storage deletion warning:", storageError.message);
        }
        
        const { error: dbError } = await supabaseServiceRole
            .from('landing_carousel_images')
            .delete()
            .eq('id', id);
            
        if (dbError) throw dbError;
        
        res.status(200).json({ message: 'Landing image deleted successfully.' });
    } catch (e) {
        console.error("Admin delete landing image failed:", e);
        res.status(500).json({ error: 'Failed to delete landing image.' });
    }
});

// Rota Admin: Obter URL de Conexão Mercado Pago
router.get('/mp-connect', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!MP_CLIENT_ID || !FRONTEND_URL) {
        return res.status(500).json({ error: "Erro de configuração: MERCADO_PAGO_CLIENT_ID ou FRONTEND_URL não definidos." });
    }
    
    const redirectUri = FRONTEND_URL + '/dev-panel'; 
    
    const connectUrl = `https://auth.mercadopago.com/oauth/authorize?client_id=${MP_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
    
    res.json({ connectUrl });
});

// --- NEW: Logo Management Routes ---

// Rota Admin: Upload e substituição do Logo do SaaS
router.post('/logo/upload', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!supabaseServiceRole || !supabaseAnon) {
        return res.status(500).json({ error: 'Erro de configuração: Supabase Client ausente.' });
    }
    
    const { fileBase64, fileName } = req.body;
    
    if (!fileBase64 || !fileName) {
        return res.status(400).json({ error: "Missing file data." });
    }
    
    const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const fileExtension = fileName.split('.').pop();
    // Use a path fixa para garantir que o upload sempre substitua o logo principal
    const storagePath = `saas-logo/main-logo.${fileExtension}`; 
    const bucketName = 'landing-carousel'; // Reusing existing bucket for simplicity
    
    try {
        // 1. Upload/Replace file
        const { error: uploadError } = await supabaseServiceRole.storage
            .from(bucketName)
            .upload(storagePath, buffer, {
                contentType: `image/${fileExtension}`,
                upsert: true, // Use upsert to replace the existing file
            });
            
        if (uploadError) throw uploadError;
        
        // 2. Get public URL
        const { data: { publicUrl } } = supabaseAnon.storage
            .from(bucketName)
            .getPublicUrl(storagePath);
            
        // 3. Update app_config table with the new URL
        const { error: configError } = await supabaseServiceRole
            .from('app_config')
            .upsert({
                key: 'saas_logo_url',
                value: publicUrl,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
            
        if (configError) throw configError;
        
        res.json({ 
            message: 'Logo uploaded and config updated successfully',
            logoUrl: publicUrl
        });
        
    } catch (e) {
        console.error("Admin logo upload failed:", e);
        res.status(500).json({ error: e.message || 'Failed to upload SaaS logo.' });
    }
});

// Rota Admin: Deletar Logo do SaaS (e reverter para o padrão)
router.delete('/logo/delete', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!supabaseServiceRole) {
        return res.status(500).json({ error: 'Erro de configuração: Supabase Service Role Client ausente.' });
    }
    
    console.log(`Admin ${req.user.id} deleting SaaS logo.`);
    
    try {
        // 1. Delete app_config entry
        const { error: configError } = await supabaseServiceRole
            .from('app_config')
            .delete()
            .eq('key', 'saas_logo_url');
            
        if (configError) throw configError;
        
        // NOTE: We skip storage deletion here as it requires knowing the exact path/extension, 
        // which is complex when using upsert. Deleting the config key is sufficient to revert the app.
        
        res.status(200).json({ message: 'SaaS logo configuration deleted successfully. Reverting to default SVG.' });
    } catch (e) {
        console.error("Admin delete logo failed:", e);
        res.status(500).json({ error: 'Failed to delete SaaS logo configuration.' });
    }
});


module.exports = router;