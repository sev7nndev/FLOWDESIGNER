const { supabaseService } = require('../config');
const axios = require('axios');

const CLIENT_ROLES = ['free', 'starter', 'pro'];

async function fetchOwnerMetrics(ownerId) {
  console.log('🔍 Fetching owner metrics for:', ownerId);
  
  let planCounts = { free: 0, starter: 0, pro: 0 };
  let statusCounts = { on: 0, paused: 0, cancelled: 0 };
  let mpConnectionStatus = 'disconnected';
  let clientList = [];

  try {
    // Fetch profiles with counts
    console.log('📊 Fetching profile counts...');
    const { data: profiles, error: profilesError } = await supabaseService
      .from('profiles')
      .select('role, status')
      .in('role', CLIENT_ROLES);
      
    if (profilesError) {
      console.error('❌ Profile count error:', profilesError);
      throw profilesError;
    }
    
    console.log('✅ Profiles fetched:', profiles.length);
    profiles.forEach(profile => {
      if (planCounts.hasOwnProperty(profile.role)) {
        planCounts[profile.role]++;
      }
      if (statusCounts.hasOwnProperty(profile.status)) {
        statusCounts[profile.status]++;
      }
    });
  } catch (e) {
    console.error("❌ Error fetching profile counts:", e.message);
    // Don't throw here, continue with other data
  }

  try {
    // Check MP connection
    console.log('💳 Checking MP connection...');
    const { data: settings, error: settingsError } = await supabaseService
      .from('app_config')
      .select('value')
      .eq('key', 'mp_access_token')
      .single();
      
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('❌ MP settings error:', settingsError);
    } else if (settings && settings.value) {
      mpConnectionStatus = 'connected';
      console.log('✅ MP connection: connected');
    } else {
      console.log('ℹ️  MP connection: not configured');
    }
  } catch (e) {
    console.error("❌ Error fetching MP connection status:", e.message);
  }

  try {
    // Fetch client list
    console.log('👥 Fetching client list...');
    const { data: clients, error: clientsError } = await supabaseService
      .from('profiles')
      .select('id, first_name, last_name, email, role, status')
      .in('role', CLIENT_ROLES)
      .order('updated_at', { ascending: false });
      
    if (clientsError) {
      console.error('❌ Client list error:', clientsError);
      throw clientsError;
    }
    
    console.log('✅ Clients fetched:', clients.length);
    clientList = clients.map(client => ({
      id: client.id,
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A',
      email: client.email || 'N/A',
      plan: client.role,
      status: client.status
    }));
  } catch (e) {
    console.error("❌ Error fetching client list:", e.message);
    // Don't throw here, continue with other data
  }

  const result = {
    planCounts,
    statusCounts,
    mpConnectionStatus,
    clients: clientList,
  };

  console.log('✅ Owner metrics result:', result);
  return result;
}

async function getMercadoPagoAuthUrl(ownerId) {
  const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner-panel`;
  const clientId = process.env.MP_CLIENT_ID;
  
  if (!clientId) {
    throw new Error("MP_CLIENT_ID não configurado.");
  }
  
  const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${ownerId}`;
  return authUrl;
}

async function disconnectMercadoPago(ownerId) {
  const { error } = await supabaseService
    .from('app_config')
    .delete()
    .eq('key', 'mp_access_token');
    
  if (error) throw error;
}

async function getOwnerChatHistory(ownerId) {
  try {
    console.log('💬 Fetching owner chat history for:', ownerId);
    
    // Fetch all clients
    const { data: clients, error: clientsError } = await supabaseService
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('role', CLIENT_ROLES);
      
    if (clientsError) {
      console.error('❌ Error fetching clients for chat:', clientsError);
      throw clientsError;
    }

    console.log('📝 Found clients for chat:', clients.length);

    // For each client, fetch their chat messages
    const chatHistory = await Promise.all(clients.map(async (client) => {
      const { data: messages, error: messagesError } = await supabaseService
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${client.id},recipient_id.eq.${ownerId}),and(sender_id.eq.${ownerId},recipient_id.eq.${client.id})`)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error(`❌ Error fetching messages for client ${client.id}:`, messagesError);
        return null;
      }

      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        sender: msg.sender_id === ownerId ? 'owner' : 'client',
        text: msg.content,
        timestamp: msg.created_at
      }));

      const lastMessage = formattedMessages[formattedMessages.length - 1] || {
        text: 'Nenhuma mensagem ainda',
        timestamp: new Date().toISOString(),
        sender: 'client'
      };

      return {
        id: client.id,
        name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
        lastMessage: {
          text: lastMessage.text,
          timestamp: lastMessage.timestamp,
          sender: lastMessage.sender
        },
        unreadCount: 0, // TODO: Implement unread count logic
        messages: formattedMessages
      };
    }));

    // Filter out null results and sort by last message timestamp
    const result = chatHistory
      .filter(thread => thread !== null)
      .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());

    console.log('✅ Chat history fetched:', result.length);
    return result;
  } catch (e) {
    console.error("❌ Error fetching owner chat history:", e.message);
    return [];
  }
}

module.exports = {
  fetchOwnerMetrics,
  getMercadoPagoAuthUrl,
  disconnectMercadoPago,
  getOwnerChatHistory,
};