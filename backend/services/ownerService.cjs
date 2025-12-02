// backend/services/ownerService.cjs
const { supabaseService } = require('../config');
const axios = require('axios');

const CLIENT_ROLES = ['free', 'starter', 'pro'];

/**
 * Busca todas as métricas necessárias para o Painel do Dono.
 * @param {string} ownerId - ID do proprietário.
 * @returns {Promise<object>} Métricas do sistema.
 */
async function fetchOwnerMetrics(ownerId) {
  let planCounts = {
    free: 0,
    starter: 0,
    pro: 0
  };
  
  let statusCounts = {
    on: 0,
    paused: 0,
    cancelled: 0
  };
  
  let mpConnectionStatus = 'disconnected';
  let clientList = [];

  try {
    // 1. Contagem de Planos e Status (Usando a VIEW para obter email)
    const { data: profiles, error: profilesError } = await supabaseService
      .from('profiles_with_email') // Usando a VIEW
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
      .from('app_config') // Usando app_config para armazenar configurações
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

  // 3. Lista de Clientes (Nome, Email, Plano, Status) - Usando a VIEW
  try {
    const { data: clients, error: clientsError } = await supabaseService
      .from('profiles_with_email') // Usando a VIEW
      .select('id, first_name, last_name, email, role, status')
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
 * @param {string} ownerId - ID do proprietário.
 * @returns {Promise<string>} URL de autorização.
 */
async function getMercadoPagoAuthUrl(ownerId) {
  // TODO: Implementar lógica real de geração da URL de autenticação
  // Esta é uma simulação. Deve-se usar as credenciais do MP e o ownerId para gerar a URL.
  const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner-panel`;
  
  // Substituir pelas credenciais reais do aplicativo Mercado Pago
  const clientId = process.env.MP_CLIENT_ID;
  if (!clientId) {
    throw new Error("MP_CLIENT_ID não configurado.");
  }
  
  const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${ownerId}`;
  return authUrl;
}

/**
 * Desconecta a conta do Mercado Pago, removendo o token de acesso.
 * @param {string} ownerId - ID do proprietário.
 */
async function disconnectMercadoPago(ownerId) {
  const { error } = await supabaseService
    .from('app_config') // Usando app_config
    .delete()
    .eq('key', 'mp_access_token');
    
  if (error) throw error;
}

/**
 * Busca o histórico de chat entre o dono e todos os clientes.
 * @param {string} ownerId - ID do proprietário.
 * @returns {Promise<Array>} Histórico de mensagens.
 */
async function getOwnerChatHistory(ownerId) {
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

  // Simulação de histórico de chat
  const mockMessages = clients.map(client => ({
    id: client.id,
    name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
    lastMessage: {
      text: `Olá, ${client.first_name || 'cliente'}. Esta é uma mensagem de exemplo.`,
      timestamp: new Date().toISOString(),
      sender: 'client'
    },
    unreadCount: Math.floor(Math.random() * 3),
    messages: [
      {
        id: 1,
        sender: 'client',
        text: "Olá, tenho uma dúvida sobre minha assinatura.",
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        sender: 'owner',
        text: "Olá! Claro, posso te ajudar. Qual é a sua dúvida?",
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  }));

  return mockMessages;
}

module.exports = {
  fetchOwnerMetrics,
  getMercadoPagoAuthUrl,
  disconnectMercadoPago,
  getOwnerChatHistory,
};