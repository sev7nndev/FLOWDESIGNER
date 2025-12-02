// backend/services/planService.cjs
const { supabaseAnon } = require('../config');

/**
 * Busca todos os planos ativos no banco de dados.
 * @returns {Promise<Array>} Lista de planos.
 */
const getActivePlans = async () => {
    const { data, error } = await supabaseAnon
        .from('plans')
        .select('id, name, price, image_quota')
        .eq('is_active', true)
        .order('price', { ascending: true });

    if (error) {
        console.error("Error fetching active plans:", error);
        throw new Error("Não foi possível carregar os planos.");
    }

    return data;
};

module.exports = {
    getActivePlans,
};