// backend/services/ownerService.cjs
const { supabaseService } = require('../config');

/**
 * Busca métricas agregadas de usuários (contagem por plano e status).
 * @returns {Promise<{totalClients: number, planCounts: object, statusCounts: object, clients: array}>}
 */
const fetchOwnerMetrics = async () => {
    // 1. Fetch all relevant profiles (clients) in one go
    const { data: allClients, error: clientsError } = await supabaseService
        .from('profiles')
        .select('id, first_name, last_name, role, status, updated_at') 
        .not('role', 'in', '("admin", "dev", "owner")');

    if (clientsError) throw new Error(clientsError.message || "Failed to fetch client profiles.");

    // 2. Aggregate counts in JavaScript
    // Adicionando 'other' para capturar roles que não são free, starter ou pro (ex: 'user' ou null)
    const countsByPlan = { free: 0, starter: 0, pro: 0, other: 0 }; 
    const countsByStatus = { on: 0, paused: 0, cancelled: 0 };
    
    allClients.forEach(client => {
        // Aggregate Plan Counts
        const role = client.role || 'other'; // Se o role for null, trata como 'other'
        
        if (countsByPlan.hasOwnProperty(role)) {
            countsByPlan[role]++;
        } else {
            // Se for um role válido, mas não mapeado (ex: 'user'), conta como 'other'
            countsByPlan.other++; 
        }
        
        // Aggregate Status Counts
        if (countsByStatus.hasOwnProperty(client.status)) {
            countsByStatus[client.status]++;
        }
    });
    
    const totalClients = allClients.length; // Contagem total real de clientes

    // 3. Buscando emails usando o Admin API (lógica anterior mantida)
    const clientIds = allClients.map(c => c.id);
    
    const { data: authUsers, error: authError } = await supabaseService.auth.admin.listUsers({
        page: 1,
        perPage: 1000, 
    });
    
    if (authError) {
        console.error("Supabase Admin API Error:", authError);
        // Não travamos o servidor, mas lançamos um erro claro
        throw new Error("Failed to fetch user list from Supabase Admin API.");
    }
    
    const usersList = authUsers?.users || [];

    const emailMap = usersList.reduce((acc, user) => {
        if (clientIds.includes(user.id)) {
            acc[user.id] = user.email;
        }
        return acc;
    }, {});
    
    // 4. Final Client List (sorting and mapping)
    const clientList = allClients
        .sort((a, b) => {
            const dateA = new Date(a.updated_at).getTime();
            const dateB = new Date(b.updated_at).getTime();
            return dateB - dateA;
        })
        .map(client => ({
            id: client.id,
            name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A',
            email: emailMap[client.id] || 'N/A (Email não encontrado)',
            plan: client.role,
            status: client.status,
        }));

    return {
        totalClients, // NOVO: Contagem total
        planCounts: countsByPlan,
        statusCounts: countsByStatus,
        clients: clientList,
    };
};

module.exports = {
    fetchOwnerMetrics,
};