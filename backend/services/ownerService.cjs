// backend/services/ownerService.cjs
const { supabaseService, MP_CLIENT_ID, MP_CLIENT_SECRET, MP_REDIRECT_URI } = require('../config');
const { MercadoPagoConfig, OAuth } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: '', options: { timeout: 5000 } });
const oauth = new OAuth(client);

/**
 * Busca métricas agregadas de usuários (contagem por plano e status).
 * @returns {Promise<{planCounts: object, statusCounts: object}>}
 */
const fetchOwnerMetrics = async (ownerId) => {
    // 1. Contagem de usuários por plano (role)
    const { data: planCounts, error: planError } = await supabaseService
        .from('profiles')
        .select('role, count')
        .not('role', 'in', '("admin", "dev", "owner")') // Exclui roles de gestão
        .rollup();

    if (planError) throw planError;
    
    const countsByPlan = planCounts.reduce((acc, item) => {
        if(item.role) acc[item.role] = item.count;
        return acc;
    }, { free: 0, starter: 0, pro: 0 });

    // 2. Contagem de usuários por status
    const { data: statusCounts, error: statusError } = await supabaseService
        .from('profiles')
        .select('status, count')
        .not('role', 'in', '("admin", "dev", "owner")')
        .rollup();
        
    if (statusError) throw statusError;
    
    const countsByStatus = statusCounts.reduce((acc, item) => {
        if(item.status) acc[item.status] = item.count;
        return acc;
    }, { on: 0, paused: 0, cancelled: 0 });
    
    // 3. Lista de Clientes (Nome, Email, Plano, Status)
    const { data: clients, error: clientsError } = await supabaseService
        .from('profiles')
        .select('id, first_name, last_name, role, status, user:id(email)')
        .not('role', 'in', '("admin", "dev", "owner")')
        .order('updated_at', { ascending: false });
        
    if (clientsError) throw clientsError;
    
    const clientList = clients.map(client => ({
        id: client.id,
        name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A',
        email: client.user?.email || 'N/A',
        plan: client.role,
        status: client.status,
    }));

    // 4. Status da Conexão Mercado Pago
    const { data: mpAccount, error: mpError } = await supabaseService
        .from('owners_payment_accounts')
        .select('owner_id')
        .eq('owner_id', ownerId)
        .single();

    return {
        planCounts: countsByPlan,
        statusCounts: countsByStatus,
        clients: clientList,
        mpConnectionStatus: mpAccount ? 'connected' : 'disconnected',
    };
};

const getMercadoPagoAuthUrl = (ownerId) => {
    if (!MP_CLIENT_ID || !MP_REDIRECT_URI) {
        throw new Error("Mercado Pago credentials are not configured in the backend.");
    }
    const state = ownerId; // Use owner's user ID as state to identify them on callback
    return oauth.getAuthorizationUrl({
        clientId: MP_CLIENT_ID,
        redirectUri: MP_REDIRECT_URI,
        state: state,
    });
};

const handleMercadoPagoCallback = async (code, ownerId) => {
    if (!code || !ownerId) {
        throw new Error("Invalid callback parameters.");
    }

    const credentials = await oauth.create({
        body: {
            client_secret: MP_CLIENT_SECRET,
            client_id: MP_CLIENT_ID,
            code: code,
            redirect_uri: MP_REDIRECT_URI,
        }
    });

    const { error } = await supabaseService
        .from('owners_payment_accounts')
        .upsert({
            owner_id: ownerId,
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
            expires_in: credentials.expires_in,
            token_type: credentials.token_type,
            scope: credentials.scope,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'owner_id' });

    if (error) {
        console.error("Error saving Mercado Pago credentials:", error);
        throw new Error("Failed to save payment credentials to the database.");
    }

    return true;
};

const disconnectMercadoPago = async (ownerId) => {
    const { error } = await supabaseService
        .from('owners_payment_accounts')
        .delete()
        .eq('owner_id', ownerId);

    if (error) {
        console.error("Error deleting Mercado Pago credentials:", error);
        throw new Error("Failed to disconnect Mercado Pago account.");
    }
    return true;
};

module.exports = {
    fetchOwnerMetrics,
    getMercadoPagoAuthUrl,
    handleMercadoPagoCallback,
    disconnectMercadoPago,
};