// backend/services/webhookService.cjs
const { supabaseService } = require('../config');

/**
 * Processa um evento de atualização de assinatura simulado.
 * Em um ambiente real, este evento viria do Stripe e conteria mais detalhes.
 * 
 * @param {{ userId: string, newPlan: 'free' | 'starter' | 'pro', newStatus: 'on' | 'paused' | 'cancelled', customerId: string }} event 
 */
const processSubscriptionUpdate = async (event) => {
    const { userId, newPlan, newStatus, customerId } = event;

    if (!userId || !newPlan || !newStatus || !customerId) {
        throw new Error('Dados de evento de webhook incompletos.');
    }

    // 1. Atualiza o perfil do usuário
    const { data, error } = await supabaseService
        .from('profiles')
        .update({ 
            role: newPlan, 
            status: newStatus,
            stripe_customer_id: customerId, // Garante que o ID do cliente Stripe está salvo
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select();

    if (error) {
        console.error(`[WEBHOOK DB ERROR] Falha ao atualizar perfil ${userId}:`, error);
        throw new Error(`Falha ao atualizar perfil: ${error.message}`);
    }
    
    console.log(`[WEBHOOK SUCCESS] Perfil ${userId} atualizado para Plano: ${newPlan}, Status: ${newStatus}`);
    
    // 2. (Opcional) Invalida o cache de métricas se necessário
    // ...
    
    return data;
};

module.exports = {
    processSubscriptionUpdate,
};