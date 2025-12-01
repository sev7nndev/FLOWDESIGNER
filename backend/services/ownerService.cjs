// backend/services/ownerService.cjs
const { supabaseService } = require('../config');
const sanitizeHtml = require('sanitize-html'); // <-- ADDED

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
 * @returns {Promise<{planCounts: object, statusCounts: object}>}
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
    };
};

module.exports = {
    fetchOwnerMetrics,
};