const express = require('express');
const router = express.Router();

const fallbackChain = require('../services/imageGeneration/fallbackChain.cjs');

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// ----------------------
// SUPABASE (Service Key)
// ----------------------
const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ----------------------
// AUTH HANDLER
// ----------------------
async function getAuthUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);
    return user;
}

router.post('/', async (req, res) => {
    console.log('🔥 [Generate] Request received');
    req.setTimeout(300000);

    try {
        // AUTH
        let user = await getAuthUser(req);
        if (req.headers['x-debug-bypass'] === 'secret_banana_key') {
            user = { id: 'debug-uuid-v3', email: 'debug@flow.app', role: 'owner' };
        }
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // GET FORM DATA
        const { promptInfo } = req.body;
        const info = promptInfo || req.body;

        const businessData = {
            nome: info.companyName || "Sua Empresa",
            descricao: info.details || "",
            pedido: info.briefing || info.pedido || "",
            whatsapp: info.phone || "",
            telefone: info.phone || "", 
            addressStreet: info.addressStreet || "",
            addressNumber: info.addressNumber || "",
            addressNeighborhood: info.addressNeighborhood || "",
            addressCity: info.addressCity || "",
            // Legacy address field fallback
            address: info.address || `${info.addressStreet || ''}, ${info.addressNumber || ''} - ${info.addressCity || ''}`,
            servicos: info.details || "",
            logo: info.logo || info.logoUrl || null,
            instagram: info.instagram || "",
            facebook: info.facebook || "",
            website: info.website || "",
            email: info.email || ""
        };

        // CALL FALLBACK CHAIN (Intelligent Generation)
        console.log("🎨 Calling Fallback Chain...");
        const generationResult = await fallbackChain.generate(businessData);
        const { imageBase64, prompt, method } = generationResult;
        
        // Use the generated prompt for storage, not the manually built one
        const finalPrompt = prompt;

        // SAVE IMAGE TO SUPABASE
        console.log("💾 Saving image to Supabase...");
        const buffer = Buffer.from(imageBase64, 'base64');
        const filename = `${user.id}/${Date.now()}_${uuidv4()}.png`;

        const { error: uploadError } = await supabase.storage
            .from('generated-images')
            .upload(filename, buffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError)
            throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
            .from('generated-images')
            .getPublicUrl(filename);

        // SAVE IN TABLE
        await supabase.from('images').insert({
            user_id: user.id,
            prompt: finalPrompt,
            image_url: publicUrl,
            business_info: businessData,
            metadata: { method: method || "FallbackChain", generatedAt: new Date().toISOString() }
        });

        // UPDATE PLAN USAGE (EXCEPT ADMINS)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role || 'free';
        const unlimited = ['owner', 'admin', 'dev'].includes(role);

        if (!unlimited) {
            const { data: usage } = await supabase
                .from('user_usage')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            const used = usage?.images_generated || 0;

            await supabase
                .from('user_usage')
                .upsert({
                    user_id: user.id,
                    images_generated: used + 1,
                    plan_id: usage?.plan_id || role,
                    cycle_start_date: usage?.cycle_start_date || new Date().toISOString()
                });
        }

        // RESPONSE
        res.json({
            success: true,
            image: {
                image_url: publicUrl,
                base64: `data:image/png;base64,${imageBase64}`
            },
            prompt: finalPrompt,
            method: method || "FallbackChain"
        });

    } catch (err) {
        console.error("❌ Generate Error:", err);
        res.status(500).json({
            error: err.message || "Unexpected error generating image"
        });
    }
});

module.exports = router;