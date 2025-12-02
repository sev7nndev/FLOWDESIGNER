const { supabaseService } = require('./supabaseClient');
const { getSupabase } = require('../services/supabaseClient');
const { MERCADO_PAGO_CLIENT_ID, MERCADO_PAGO_CLIENT_SECRET, APP_URL } = require('../config');
const axios = require('axios');

const CLIENT_ROLES = ['free', 'starter', 'pro'];

/**
 * Busca todas as métricas necessárias para o Painel do Dono.
 * @returns {Promise<object>} Métricas do sistema.
 */
async function fetchOwnerMetrics() {
    let planCounts = { free: 0, starter: 0, pro: 0 };
    let statusCounts = { on: 0, paused: 0, cancelled: 0 };
    let mpConnectionStatus = 'disconnected';
    let clientList = [];

    try {
        // 1. Contagem de Planos e Status (Ainda usa 'profiles' para contagem rápida)
        const { data: profiles, error: profilesError } = await supabaseService
            .from('profiles')
            .select('role, status')
            .in('role', CLIENT_ROLES);

        if (profilesError) throw profilesError;

        profiles.forEach(profile => {
            if (planCounts.hasOwnProperty(profile.role)) {
                planCounts[profile.role]++;
            }
            if (statusCounts.hasOwnProperty(profile.status)) {
                statusCounts[profile.status]++;
            }
        });

    } catch (e) {
        console.error("Error fetching profile counts:", e.message);
    }

    // 2. Status da Conexão Mercado Pago (MP)
    try {
        const { data: settings, error: settingsError } = await supabaseService
            .from('settings')
            .select('value')
            .eq('key', 'mp_access_token')
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = No rows found
            throw settingsError;
        }

        if (settings && settings.value) {
            mpConnectionStatus = 'connected';
        }
    } catch (e) {
        console.error("Error fetching MP connection status:", e.message);
    }

    // 3. Lista de Clientes (Nome, Email, Plano, Status) - CORRIGIDO PARA USAR A VIEW
    try {
        // Usando a VIEW profiles_with_email para evitar o erro 500 do join com auth.users
        const { data: clients, error: clientsError } = await supabaseService
            .from('profiles_with_email')
            .select('*')
            .in('role', CLIENT_ROLES)
            .order('updated_at', { ascending: false });

        if (clientsError) throw clientsError;

        clientList = clients.map(client => ({
            id: client.id,
            name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A',
            email: client.email || 'N/A',
            plan: client.role,
            status: client.status
        }));

    } catch (e) {
        console.error("Error fetching client list:", e.message);
    }

    return {
        planCounts,
        statusCounts,
        mpConnectionStatus,
        clients: clientList,
    };
}

/**
 * Gera a URL de autorização do Mercado Pago.
 * @returns {Promise<string>} URL de autorização.
 */
async function getOwnerMpAuthUrl() {
    const redirectUri = `${APP_URL}/owner-panel`;
    const authUrl = `https://auth.mercadopago.com/authorization?client_id=${MERCADO_PAGO_CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}`;
    return authUrl;
}

/**
 * Desconecta a conta do Mercado Pago, removendo o token de acesso.
 */
async function disconnectOwnerMp() {
    const { error } = await supabaseService
        .from('settings')
        .delete()
        .eq('key', 'mp_access_token');

    if (error) throw error;
}

/**
 * Busca o histórico de chat entre o dono e todos os clientes.
 * @returns {Promise<Array>} Histórico de mensagens.
 */
async function getOwnerChatHistory() {
    // Para garantir que o chat funcione com os IDs reais dos clientes,
    // vamos buscar a lista de clientes usando a nova view
    let clients = [];
    try {
        const { data, error } = await supabaseService
            .from('profiles_with_email')
            .select('id, first_name, last_name, email')
            .in('role', CLIENT_ROLES);
        
        if (error) throw error;
        clients = data;
    } catch (e) {
        console.error("Error fetching clients for chat history:", e.message);
        return [];
    }

    const mockMessages = clients.map(client => ({
        id: client.id,
        name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
        lastMessage: {
            text: `Olá, ${client.first_name || 'cliente'}. Sua última mensagem foi sobre a quota de imagens.`,
            timestamp: new Date().toISOString(),
            sender: 'client'
        },
        unreadCount: Math.floor(Math.random() * 3),
        messages: [
            { id: 1, sender: 'client', text: "Minha quota de imagens não atualizou após a renovação.", timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, sender: 'owner', text: "Verificamos o problema. Sua quota foi restaurada. Pedimos desculpas pelo inconveniente!", timestamp: new Date(Date.now() - 1800000).toISOString() },
            { id: 3, sender: 'client', text: "Ótimo, obrigado!", timestamp: new Date(Date.now() - 60000).toISOString() },
        ]
    }));

    return mockMessages;
}

module.exports = {
    fetchOwnerMetrics,
    getOwnerMpAuthUrl,
    disconnectOwnerMp,
    getOwnerChatHistory,
};