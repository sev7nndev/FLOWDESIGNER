const express = require('express');
const router = express.Router();
const fallbackChain = require('../services/imageGeneration/fallbackChain.cjs');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Admin Supabase Client (Service Role) for backend operations
const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to get auth user
const getAuthUser = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    
    // Auth check using standard method
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return user;
};

router.post('/', async (req, res) => {
    console.log('🌊 [Generate Route] New Request Received');
    // Increase timeout for this request
    req.setTimeout(300000); // 5 minutes

    try {
        // 1. Auth Check
        let user = await getAuthUser(req);
        
        // DEBUG BYPASS
        if (req.headers['x-debug-bypass'] === 'secret_banana_key') {
             console.log("🔓 DEBUG: Bypassing Auth");
             user = { id: 'debug-uuid-v3', role: 'owner', email: 'debug@flow.app' };
        }

        if (!user) {
             return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // 2. Data Extraction
        const { promptInfo } = req.body;
        // Allow fallback if promptInfo provided directly or nested
        const info = promptInfo || req.body;

        const businessData = {
            nome: info.companyName || "Sua Empresa",
            descricao: info.details || "",
            pedido: info.briefing || info.pedido || "",
            whatsapp: info.phone || "",
            telefone: info.phone || "", 
            address: info.address || info.endereco || "",
            servicos: info.details || "",
            logo: info.logo || info.logoUrl || null
        };

        // 3. Initiate Generation Chain
        const generationResult = await fallbackChain.generate(businessData);
        const { imageBase64, prompt, method } = generationResult;
        
        // 4. Save to Storage & DB
        console.log('💾 Saving to Supabase...');
        const buffer = Buffer.from(imageBase64, 'base64');
        const filename = `${user.id}/${Date.now()}_${uuidv4()}.png`;

        // Upload to Bucket
        const { error: uploadError } = await supabase.storage
            .from('generated-images')
            .upload(filename, buffer, { contentType: 'image/png', upsert: false });

        if (uploadError) throw new Error(`Storage Upload Failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
            .from('generated-images')
            .getPublicUrl(filename);

        // Insert into Images Table
        await supabase.from('images').insert({
            user_id: user.id,
            prompt: prompt,
            image_url: publicUrl,
            business_info: businessData,
            metadata: { method, generatedAt: new Date().toISOString() }
        });

        // 5. Update Usage (if not owner/admin)
        // Check role first
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role || 'free';
        const isUnlimited = ['owner', 'admin', 'dev'].includes(role);

        if (!isUnlimited) {
            console.log(`📊 Tracking usage for User: ${user.id} | Role: ${role}`);
            // Fetch usage
            const { data: u } = await supabase.from('user_usage').select('images_generated, plan_id').eq('user_id', user.id).maybeSingle();
            const currentCount = u?.images_generated || 0;
            const currentPlan = u?.plan_id || role;
            
            // Upsert usage
             await supabase.from('user_usage').upsert({
                user_id: user.id,
                images_generated: currentCount + 1,
                plan_id: currentPlan,
                cycle_start_date: u?.cycle_start_date || new Date().toISOString()
            }, { onConflict: 'user_id' });
        }

        // 6. Send Response
        res.json({
            success: true,
            image: {
                id: 'generated', 
                image_url: publicUrl, 
                base64_preview: `data:image/png;base64,${imageBase64}` 
            },
            method: method,
            prompt: prompt
        });

    } catch (error) {
        console.error('❌ [Generate Route] Error:', error.message);
        res.status(500).json({ error: error.message || 'Generation failed' });
    }
});

module.exports = router;
