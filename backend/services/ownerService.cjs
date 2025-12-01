// backend/services/ownerService.cjs
const { supabaseService } = require('../config');

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
    // CORREÇÃO: Removendo o join complexo que estava causando falhas.
    const { data: clients, error: clientsError } = await supabaseService
        .from('profiles')
        .select('first_name, last_name, role, status, id') // Removendo o join 'auth_user:id(email)'
        .not('role', 'in', '("admin", "dev", "owner")')
        .order('updated_at', { ascending: false });
        
    if (clientsError) throw clientsError;
    
    // Buscando emails usando o Admin API (mais seguro)
    const clientIds = clients.map(c => c.id);
    
    // Busca todos os usuários (limitado a 1000 por padrão, o que é suficiente para a maioria dos SaaS)
    const { data: authUsers, error: authError } = await supabaseService.auth.admin.listUsers({
        page: 1,
        perPage: 1000, 
    });
    
    if (authError) throw authError;
    
    const emailMap = authUsers.users.reduce((acc, user) => {
        if (clientIds.includes(user.id)) {
            acc[user.id] = user.email;
        }
        return acc;
    }, {});
    
    const clientList = clients.map(client => ({
        id: client.id,
        name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A',
        email: emailMap[client.id] || 'N/A (Email não encontrado)',
        plan: client.role,
        status: client.status,
    }));

    return {
        planCounts: countsByPlan,
        statusCounts: countsByStatus,
        clients: clientList,
    };
};

module.exports = {
    fetchOwnerMetrics,
};