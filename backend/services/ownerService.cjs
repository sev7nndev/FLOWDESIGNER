// backend/services/ownerService.cjs
const { supabaseService, MP_CLIENT_ID, MP_CLIENT_SECRET, MP_REDIRECT_URI } = require('../config');
const { MercadoPagoConfig, OAuth } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: '', options: { timeout: 5000 } });
const oauth = new OAuth(client);

/**
 * Helper function to safely fetch count from Supabase.
 * Returns 0 on error or if no count is found.
 */
const safeFetchCount = async (query, role = 'N/A', status = 'N/A') => {
    try {
        const { count, error } = await query.select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`Supabase Count Error for Role=${role}, Status=${status}:`, error.message);
            return 0;
        }
        if (count === 0) {
            // Log the query details if count is zero to help debug filtering
            console.log(`DEBUG: Count is zero for Role=${role}, Status=${status}.`);
        }
        return count || 0;
    } catch (e) {
        console.error(`Unexpected error during count query for Role=${role}, Status=${status}:`, e.message, e.stack);
        return 0;
    }
};

/**
 * Busca métricas agregadas de usuários (contagem por plano e status).
 * @returns {Promise<{planCounts: object, statusCounts: object}>}
 */
const fetchOwnerMetrics = async (ownerId) => {
    const CLIENT_ROLES = ['free', 'starter', 'pro'];
    
    // --- DEBUG: Contagem Total de Perfis ---
    const totalProfiles = await safeFetchCount(supabaseService.from('profiles'), 'TOTAL');
    console.log(`DEBUG: Total profiles found in DB: ${totalProfiles}`);
    
    // --- 1. Contagem de usuários por plano (role) ---
    const countsByPlan = { free: 0, starter: 0, pro: 0 };
    
    countsByPlan.free = await safeFetchCount(supabaseService.from('profiles').eq('role', 'free'), 'free');
    countsByPlan.starter = await safeFetchCount(supabaseService.from('profiles').eq('role', 'starter'), 'starter');
    countsByPlan.pro = await safeFetchCount(supabaseService.from('profiles').eq('role', 'pro'), 'pro');
    
    // --- 2. Contagem de usuários por status ---
    const countsByStatus = { on: 0, paused: 0, cancelled: 0 };
    
    // Aplicando FIX: Passando o array CLIENT_ROLES
    countsByStatus.on = await safeFetchCount(supabaseService.from('profiles').eq('status', 'on').in('role', CLIENT_ROLES), CLIENT_ROLES.join('|'), 'on');
    countsByStatus.paused = await safeFetchCount(supabaseService.from('profiles').eq('status', 'paused').in('role', CLIENT_ROLES), CLIENT_ROLES.join('|'), 'paused');
    countsByStatus.cancelled = await safeFetchCount(supabaseService.from('profiles').eq('status', 'cancelled').in('role', CLIENT_ROLES), CLIENT_ROLES.join('|'), 'cancelled');
    
    // 3. Lista de Clientes (Nome, Email, Plano, Status)
    let clientList = [];
    try {
        const { data: clients, error: clientsError } = await supabaseService
            .from('profiles')
            .select('id, first_name, last_name, role, status, auth_user:id(email)') 
            .in('role', CLIENT_ROLES) 
            .order('updated_at', { ascending: false });
            
        if (clientsError) throw clientsError;
        
        clientList = clients.map(client => {
            const email = (client.auth_user && Array.isArray(client.auth_user) ? client.auth_user[0]?.email : client.auth_user?.email) || 'N/A';
            
            return {
                id: client.id,
                name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A',
                email: email, 
                plan: client.role,
                status: client.status,
            };
        });
    } catch (e) {
        console.error("Error fetching client list:", e.message);
    }

    // 4. Status da Conexão Mercado Pago
    let mpConnectionStatus = 'disconnected';
    try {
        const { data: mpAccount } = await supabaseService
            .from('owners_payment_accounts')
            .select('owner_id')
            .eq('owner_id', ownerId)
            .single();

        if (mpAccount) {
            mpConnectionStatus = 'connected';
        }
    } catch (e) {
        console.error("Error checking MP connection status:", e.message);
    }

    return {
        planCounts: countsByPlan,
        statusCounts: countsByStatus,
        clients: clientList,
        mpConnectionStatus: mpConnectionStatus,
    };
};

const getMercadoPagoAuthUrl = (ownerId) => {
    if (!MP_CLIENT_ID || !MP_REDIRECT_URI) {
        throw new Error("Mercado Pago credentials are not configured in the backend.");
    }
    const state = ownerId; 
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