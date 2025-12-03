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

module.exports = router;