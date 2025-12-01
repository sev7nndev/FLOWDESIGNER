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
    // 1. Busca o stripe_customer_id do perfil (Mock: assume que existe)
    const { data: profileData, error: profileError } = await supabaseService
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

    if (profileError || !profileData || !profileData.stripe_customer_id) {
        // Se não tiver ID do Stripe, assume que é um novo cliente ou plano FREE
        // Redireciona para a página de preços para iniciar a assinatura
        return 'https://mock-billing-portal.com/pricing'; 
    }
    
    // Mock: Retorna uma URL de portal de faturamento simulada
    return `https://mock-billing-portal.com/session/${profileData.stripe_customer_id}`;
};


module.exports = {
    fetchOwnerMetrics,
    createBillingPortalSession, // Exportando a nova função
};