const { supabaseServiceRole } = require('../config.cjs');

// Quota Increment
async function incrementUserUsage(userId) {
    if (!supabaseServiceRole) throw new Error('Supabase Service Role Client ausente.');
    
    // Calls the PostgreSQL function 'increment_user_usage'
    const { error } = await supabaseServiceRole.rpc('increment_user_usage', { user_id_input: userId });
    
    if (error) {
        console.error("Failed to increment usage:", error);
        throw new Error("Falha ao registrar uso.");
    }
}

module.exports = {
    incrementUserUsage,
};