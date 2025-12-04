const express = require('express');
const { supabaseServiceRole } = require('../config.cjs');
const { verifyAuth } = require('../middleware/auth.cjs');

const router = express.Router();

// Rota de Verificação de Quota
router.get('/', verifyAuth, async (req, res) => {
    if (!supabaseServiceRole) {
        return res.status(500).json({ error: 'Erro de configuração: Supabase Service Role Client ausente.' });
    }
    
    console.log(`User ${req.user.id} checked quota.`);
    
    try {
        // 1. Fetch Usage Data
        let { data: usageData, error: usageError } = await supabaseServiceRole
            .from('user_usage')
            .select('user_id, plan_id, current_usage, cycle_start_date')
            .eq('user_id', req.user.id)
            .single();
            
        if (usageError && usageError.code !== 'PGRST116') { 
            throw new Error("Falha ao buscar uso do usuário.");
        }
        
        // If no usage data, create default 'free' usage record (fallback)
        if (!usageData) {
            usageData = { user_id: req.user.id, plan_id: 'free', current_usage: 0, cycle_start_date: new Date().toISOString() };
        }
        
        // 2. Fetch Plan Settings (Limits)
        const { data: planSettings, error: planError } = await supabaseServiceRole
            .from('plan_settings')
            .select('id, max_images_per_month, price')
            .eq('id', usageData.plan_id)
            .single();
            
        // --- OWNER/ADMIN OVERRIDE ---
        if (usageData.plan_id === 'owner' || usageData.plan_id === 'admin' || usageData.plan_id === 'dev') {
            const unlimitedPlan = { id: usageData.plan_id, max_images_per_month: 99999, price: 0 };
            
            res.json({
                status: 'ALLOWED',
                usage: { ...usageData, current_usage: 0, plan_id: usageData.plan_id }, // Reset usage display for unlimited plans
                plan: unlimitedPlan,
                plans: [], // Will be fetched separately by frontend if needed, but we return minimal data here
                message: "Acesso Ilimitado."
            });
            return;
        }
        // --- END OWNER/ADMIN OVERRIDE ---
            
        if (planError || !planSettings) throw new Error(`Plan settings not found for plan ID: ${usageData.plan_id}`);
        
        const maxImages = planSettings.max_images_per_month;
        let status = 'ALLOWED';
        let message = "Quota OK.";
        
        if (usageData.current_usage >= maxImages) {
            status = 'BLOCKED';
            message = "Limite de geração atingido.";
        } else if (maxImages > 0 && usageData.current_usage / maxImages > 0.8) {
            status = 'NEAR_LIMIT';
            message = "Você está perto do limite de gerações.";
        }
        
        // 3. Fetch All Plans Details and Settings Separately
        const [
            { data: allDetailsData, error: allDetailsError },
            { data: allSettingsData, error: allSettingsError }
        ] = await Promise.all([
            supabaseServiceRole.from('plan_details').select('*'),
            supabaseServiceRole.from('plan_settings').select('id, price, max_images_per_month')
        ]);
        
        if (allDetailsError) throw new Error("Failed to fetch all plan details.");
        if (allSettingsError) throw new Error("Failed to fetch all plan settings.");
        
        const settingsMap = new Map(allSettingsData.map(s => [s.id, s]));
        
        const plans = allDetailsData.map(p => {
            const setting = settingsMap.get(p.id);
            return {
                id: p.id,
                display_name: p.display_name,
                description: p.description,
                features: p.features,
                price: setting?.price || 0,
                max_images_per_month: setting?.max_images_per_month || 0
            };
        });

        res.json({
            status: status,
            usage: usageData,
            plan: planSettings,
            plans: plans,
            message: message
        });
        
    } catch (e) {
        console.error("Quota check failed:", e);
        res.status(500).json({ error: e.message || 'Internal server error during quota check.' });
    }
});

module.exports = router;