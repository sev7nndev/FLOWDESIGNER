// backend/services/ownerService.cjs
const { supabaseService } = require('../config');
const sanitizeHtml = require('sanitize-html');

// Define prices for calculation
const PLAN_PRICES = {
    starter: 29.99,
    pro: 49.99,
    free: 0,
};

/**
 * Masks an email address (e.g., user@example.com -> u***@e***.com)
 * @param {string} email 
 * @returns {string} Masked email
 */
const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return 'N/A';
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return 'N/A';

    const maskedLocal = localPart.length > 1 
        ? localPart[0] + '***' 
        : localPart;

    const domainParts = domain.split('.');
    const maskedDomain = domainParts[0].length > 1 
        ? domainParts[0][0] + '***' 
        : domainParts[0];
        
    return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
};


/**
 * Busca métricas agregadas de usuários (contagem por plano e status).
 * @returns {Promise<{planCounts: object, statusCounts: object, estimatedRevenue: number}>}
 */
const fetchOwnerMetrics = async () => {
    // 1. Contagem de usuários por plano (role)
    const { data: planCounts, error: planError } = await supabaseService
        .from('profiles')
        .select('role, count')
        .not('role', 'in', '("admin", "dev", "owner")') // Exclui roles de gestão
        .rollup();

    if (planError) throw planError;
    
    const countsByPlan = planCounts.reduce((acc, item) => {
        acc[item.role] = item.count;
        return acc;
    }, { free: 0, starter: 0, pro: 0 }); // Inicializa para garantir que todos os planos apareçam

    // 1.1 Calculate Estimated Monthly Revenue (MRR)
    const estimatedRevenue = (
        (countsByPlan.starter || 0) * PLAN_PRICES.starter +
        (countsByPlan.pro || 0) * PLAN_PRICES.pro
    ).toFixed(2); // Format to 2 decimal places

    // 2. Contagem de usuários por status
    const { data: statusCounts, error: statusError } = await supabaseService
        .from('profiles')
        .select('status, count')
        .not('role', 'in', '("admin", "dev", "owner")')
        .rollup();
        
    if (statusError) throw statusError;
    
    const countsByStatus = statusCounts.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
    }, { on: 0, paused: 0, cancelled: 0 });
    
    // 3. Lista de Clientes (Nome, Email, Plano, Status)
    const { data: clients, error: clientsError } = await supabaseService
        .from('profiles')
        .select('first_name, last_name, role, status, id, auth_user:id(email)')
        .not('role', 'in', '("admin", "dev", "owner")')
        .order('updated_at', { ascending: false });
        
    if (clientsError) throw clientsError;
    
    const clientList = clients.map(client => {
        const rawFullName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A';
        
        // Apply sanitization to the full name before returning
        const safeFullName = sanitizeHtml(rawFullName, { allowedTags: [], allowedAttributes: {} });
        
        return {
            id: client.id,
            name: safeFullName,
            // Aplica a máscara ao e-mail
            email: maskEmail(client.auth_user?.email || 'N/A'), 
            plan: client.role,
            status: client.status,
        };
    });

    return {
        planCounts: countsByPlan,
        statusCounts: countsByStatus,
        clients: clientList,
        estimatedRevenue: parseFloat(estimatedRevenue), // Return as number
    };
};

/**
 * MOCK: Simula a criação de uma sessão do portal de faturamento.
 * Em um ambiente real, isso chamaria a API do Stripe.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<string>} A URL de redirecionamento do portal de faturamento.
 */
const createBillingPortalSession = async (userId) => {
    // 1. Busca o stripe_customer_id e o role do perfil
    const { data: profileData, error: profileError } = await supabaseService
        .from('profiles')
        .select('stripe_customer_id, role')
        .eq('id', userId)
        .single();

    if (profileError || !profileData) {
        throw new Error('Perfil do usuário não encontrado.');
    }
    
    let customerId = profileData.stripe_customer_id;
    
    // Se o usuário for 'free' e não tiver um customerId, simula a criação de um
    if (profileData.role === 'free' && !customerId) {
        // Gera um ID de cliente mockado
        customerId = `cus_mock_${userId.substring(0, 8)}`;
        
        // Atualiza o perfil com o ID do cliente mockado
        const { error: updateError } = await supabaseService
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);
            
        if (updateError) {
            console.error('Falha ao atribuir customer ID mockado:', updateError);
            // Continua, mas o log é importante
        }
        
        // Redireciona para a página de preços para iniciar a assinatura
        return 'https://mock-billing-portal.com/pricing'; 
    }
    
    // Se o usuário já tiver um customerId (mesmo que seja mockado), redireciona para o portal
    if (customerId) {
        return `https://mock-billing-portal.com/session/${customerId}`;
    }
    
    // Caso de fallback (deve ser raro)
    return 'https://mock-billing-portal.com/pricing';
};

/**
 * Atualiza o plano e status de um cliente no banco de dados.
 * @param {string} clientId - O ID do cliente.
 * @param {string} newPlan - O novo plano ('free', 'starter', 'pro').
 * @param {string} newStatus - O novo status ('on', 'paused', 'cancelled').
 */
const updateClientPlan = async (clientId, newPlan, newStatus) => {
    // 1. Atualiza o perfil (role e status)
    const { error: profileError } = await supabaseService
        .from('profiles')
        .update({ 
            role: newPlan, 
            status: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

    if (profileError) {
        console.error(`Falha ao atualizar perfil do cliente ${clientId}:`, profileError);
        throw new Error(`Falha ao atualizar perfil: ${profileError.message}`);
    }
    
    // 2. Atualiza a tabela user_usage (apenas o plan_id)
    const { error: usageError } = await supabaseService
        .from('user_usage')
        .update({ 
            plan_id: newPlan,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', clientId);
        
    if (usageError) {
        console.error(`Falha ao atualizar uso do cliente ${clientId}:`, usageError);
        // Não lançamos erro fatal aqui, pois o perfil foi atualizado, mas logamos.
    }
    
    // Se o plano for alterado para 'free', resetamos o uso para 0 para dar o limite gratuito
    if (newPlan === 'free') {
        const { error: resetError } = await supabaseService
            .from('user_usage')
            .update({ 
                current_usage: 0,
                cycle_start_date: new Date().toISOString()
            })
            .eq('user_id', clientId);
            
        if (resetError) {
            console.error(`Falha ao resetar uso do cliente ${clientId}:`, resetError);
        }
    }
};


module.exports = {
    fetchOwnerMetrics,
    createBillingPortalSession,
    updateClientPlan, // Exportando a nova função
};