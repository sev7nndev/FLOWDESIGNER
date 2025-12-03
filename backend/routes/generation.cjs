const express = require('express');
const sanitizeHtml = require('sanitize-html');
const rateLimit = require('express-rate-limit');
const { supabaseServiceRole, PORT } = require('../config.cjs');
const { verifyAuth } = require('../middleware/auth.cjs');
const { generateDetailedPrompt, generateImage, uploadImageToSupabase } = require('../helpers/imageUtils.cjs');
const { incrementUserUsage } = require('../helpers/quotaUtils.cjs');

const router = express.Router();

// Rate Limiting
const generationLimiter = rateLimit({ 
    windowMs: 60 * 1000, 
    max: 5, 
    message: { error: "Muitas requisições. Tente novamente em um minuto." }, 
    standardHeaders: true, 
    legacyHeaders: false 
});

// Rota de Geração de Imagem
router.post('/', verifyAuth, generationLimiter, async (req, res) => {
    if (!supabaseServiceRole) {
        return res.status(500).json({ error: 'Erro de configuração: Supabase Service Role Client ausente.' });
    }
    
    const { promptInfo } = req.body;
    const user = req.user;
    
    if (!promptInfo || !promptInfo.companyName || !promptInfo.details) {
        return res.status(400).json({ error: "Nome da empresa e detalhes são obrigatórios." });
    }
    
    const sanitizedPromptInfo = {
        companyName: sanitizeHtml(promptInfo.companyName || ''),
        phone: sanitizeHtml(promptInfo.phone || ''),
        addressStreet: sanitizeHtml(promptInfo.addressStreet || ''),
        addressNumber: sanitizeHtml(promptInfo.addressNumber || ''),
        addressNeighborhood: sanitizeHtml(promptInfo.addressNeighborhood || ''),
        addressCity: sanitizeHtml(promptInfo.addressCity || ''),
        details: sanitizeHtml(promptInfo.details || ''),
        logo: promptInfo.logo 
    };
    
    try {
        // 1. Quota Check (Calling the internal check-quota endpoint for consistency)
        const checkQuotaRes = await fetch(`http://localhost:${PORT}/api/check-quota`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        
        const quotaResponse = await checkQuotaRes.json();
        
        if (quotaResponse.status === 'BLOCKED') {
            return res.status(403).json({ 
                error: quotaResponse.message || 'Limite de geração atingido.',
                quotaStatus: 'BLOCKED',
                usage: quotaResponse.usage,
                plan: quotaResponse.plan
            });
        }
        
        // 2. Generate Detailed Prompt
        const detailedPrompt = generateDetailedPrompt(sanitizedPromptInfo);
        
        // 3. Generate Image
        const generatedImageDataUrl = await generateImage(detailedPrompt);
        
        // 4. Upload Image to Storage
        const imagePath = await uploadImageToSupabase(generatedImageDataUrl, user.id);
        
        // 5. Save metadata to 'images' table
        const { data: imageMetadata, error: dbError } = await supabaseServiceRole
            .from('images')
            .insert({
                user_id: user.id,
                prompt: detailedPrompt,
                image_url: imagePath,
                business_info: sanitizedPromptInfo,
            })
            .select('*')
            .single();
            
        if (dbError) throw dbError;
        
        // 6. Increment Quota
        await incrementUserUsage(user.id);
        
        res.json({ 
            message: 'Arte gerada com sucesso!',
            image: imageMetadata
        });
        
    } catch (error) {
        console.error("Generation failed:", error);
        res.status(500).json({ error: error.message || 'Erro interno ao gerar arte.' });
    }
});

module.exports = router;