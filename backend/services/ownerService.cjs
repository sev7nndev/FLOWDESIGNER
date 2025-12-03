const { supabaseService } = require('../config');
const fetch = require('node-fetch'); 
const mercadopago = require('mercadopago');

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
  }

  try {
    // Check MP connection
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
      .from('profiles_with_email')
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
  const redirectUri = `${process.env.BACKEND_URL}/api/owner/mp-callback`;
  const clientId = process.env.MP_CLIENT_ID;
  
  if (!clientId) {
    throw new Error("MP_CLIENT_ID não configurado.");
  }
  
  const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${ownerId}`;
  return authUrl;
}

async function handleMercadoPagoCallback(code, ownerId) {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  const redirectUri = `${process.env.BACKEND_URL}/api/owner/mp-callback`; 
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    throw new Error("MP_CLIENT_ID ou MP_CLIENT_SECRET não configurados.");
  }

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

  // Salva os tokens
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
  
  return ownerId;
}

async function disconnectMercadoPago(ownerId) {
  const { error } = await supabaseService
    .from('owners_payment_accounts')
    .delete()
    .eq('owner_id', ownerId);
    
  if (error) throw error;
}

module.exports = {
  fetchOwnerMetrics,
  getMercadoPagoAuthUrl,
  handleMercadoPagoCallback,
  disconnectMercadoPago,
};