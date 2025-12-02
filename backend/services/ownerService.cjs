const { supabaseService } = require('../config');
const fetch = require('node-fetch'); // Need to ensure node-fetch is available if not using global fetch

const CLIENT_ROLES = ['free', 'starter', 'pro'];

async function fetchOwnerMetrics(ownerId) {
  console.log('🔍 Fetching owner metrics for:', ownerId);
  
  let planCounts = { free: 0, starter: 0, pro: 0 };
  let statusCounts = { on: 0, paused: 0, cancelled: 0 };
  let mpConnectionStatus = 'disconnected';
  let clientList = [];

  try {
    // Verify user is owner
    const { data: ownerProfile, error: ownerError } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', ownerId)
      .single();

    if (ownerError || !ownerProfile || ownerProfile.role !== 'owner') {
      throw new Error('Acesso negado. Apenas proprietários podem acessar estas métricas.');
    }

    // Fetch profiles with counts using service role
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
    // Check MP connection using owners_payment_accounts
    console.log('💳 Checking MP connection...');
    const { data: mpAccount, error: mpAccountError } = await supabaseService
      .from('owners_payment_accounts')
      .select('access_token')
      .eq('owner_id', ownerId)
      .single();
      
    if (mpAccountError && mpAccountError.code !== 'PGRST116') {
      console.error('❌ MP account error:', mpAccountError);
    } else if (mpAccount && mpAccount.access_token) {
      mpConnectionStatus = 'connected';
      console.log('✅ MP connection: connected');
    } else {
      console.log('ℹ️  MP connection: not configured');
    }
  } catch (e) {
    console.error("❌ Error fetching MP connection status:", e.message);
  }

  try {
    // Fetch client list with full details
    console.log('👥 Fetching client list...');
    const { data: clients, error: clientsError } = await supabaseService
      .from('profiles_with_email') // Use the existing view
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

function getMercadoPagoAuthUrl(ownerId) {
  const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner-panel`;
  const clientId = process.env.MP_CLIENT_ID;
  
  if (!clientId) {
    throw new Error("MP_CLIENT_ID não configurado.");
  }
  
  // State must be URL encoded if it contains special characters, but ownerId (UUID) is safe.
  const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${ownerId}`;
  return authUrl;
}

async function handleMercadoPagoCallback(code, ownerId) {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner-panel`;

  if (!clientId || !clientSecret) {
    throw new Error("MP_CLIENT_ID ou MP_CLIENT_SECRET não configurados.");
  }

  // Use node-fetch (imported globally in server.cjs or available via require)
  const response = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error("MP Token Exchange Error:", data);
    throw new Error(data.message || "Falha ao trocar código por token do Mercado Pago.");
  }

  // Save tokens to owners_payment_accounts
  const { error } = await supabaseService
    .from('owners_payment_accounts')
    .upsert({
      owner_id: ownerId,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
      updated_at: new Date().toISOString()
    }, { onConflict: 'owner_id' });

  if (error) {
    console.error("Supabase save token error:", error);
    throw new Error("Falha ao salvar credenciais do Mercado Pago no banco de dados.");
  }
}

async function disconnectMercadoPago(ownerId) {
  // Delete the record from owners_payment_accounts
  const { error } = await supabaseService
    .from('owners_payment_accounts')
    .delete()
    .eq('owner_id', ownerId);
    
  if (error) throw error;
}

async function getOwnerChatHistory(ownerId) {
  try {
    console.log('💬 Fetching owner chat history for:', ownerId);
    
    // Verify user is owner
    const { data: ownerProfile, error: ownerError } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', ownerId)
      .single();

    if (ownerError || !ownerProfile || ownerProfile.role !== 'owner') {
      throw new Error('Acesso negado. Apenas proprietários podem acessar o histórico de chat.');
    }

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
      // Fetch messages between client and owner
      const { data: messages, error: messagesError } = await supabaseService
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${client.id},recipient_id.eq.${ownerId}),and(sender_id.eq.${ownerId},recipient_id.eq.${client.id})`)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error(`❌ Error fetching messages for client ${client.id}:`, messagesError);
        return null;
      }
      
      // Filter out clients with no messages to keep the list clean
      if (messages.length === 0) {
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
  handleMercadoPagoCallback,
  disconnectMercadoPago,
  getOwnerChatHistory,
};