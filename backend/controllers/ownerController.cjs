const ownerService = require('../services/ownerService');

const getOwnerMetrics = async (req, res) => {
  try {
    console.log('📊 Fetching owner metrics for user:', req.user.id);
    const ownerId = req.user.id;
    const metrics = await ownerService.fetchOwnerMetrics(ownerId);
    
    if (!metrics || typeof metrics !== 'object') {
      console.error('Invalid metrics structure:', metrics);
      return res.status(500).json({ 
        error: "Estrutura de métricas inválida.",
        details: "O serviço retornou dados inválidos."
      });
    }
    
    console.log('✅ Owner metrics fetched successfully');
    return res.status(200).json(metrics);
  } catch (error) {
    console.error("❌ Error in getOwnerMetrics controller:", error.message);
    return res.status(500).json({ 
      error: "Falha ao carregar dados do servidor.",
      details: error.message 
    });
  }
};

const getMercadoPagoAuthUrl = (req, res) => {
  try {
    const ownerId = req.user.id;
    const authUrl = ownerService.getMercadoPagoAuthUrl(ownerId);
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error("Error getting MP auth URL:", error);
    res.status(500).json({ error: "Failed to generate Mercado Pago authorization URL." });
  }
};

const handleMercadoPagoCallback = async (req, res) => {
  const { code, state } = req.query;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}/owner-panel?mp_status=error&message=${encodeURIComponent("Missing authorization code or state.")}`);
  }

  try {
    await ownerService.handleMercadoPagoCallback(code, state);
    res.redirect(`${FRONTEND_URL}/owner-panel?mp_status=success`);
  } catch (error) {
    console.error("Error handling MP callback:", error);
    res.redirect(`${FRONTEND_URL}/owner-panel?mp_status=error&message=${encodeURIComponent(error.message)}`);
  }
};

const disconnectMercadoPago = async (req, res) => {
  try {
    const ownerId = req.user.id;
    await ownerService.disconnectMercadoPago(ownerId);
    res.status(200).json({ message: "Mercado Pago account disconnected successfully." });
  } catch (error) {
    console.error("Error disconnecting MP account:", error);
    res.status(500).json({ error: "Failed to disconnect Mercado Pago account." });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { supabaseService } = require('../config');
    
    // Buscar todas as mensagens onde o owner está envolvido
    const { data: messages, error } = await supabaseService
      .from('chat_messages')
      .select(`
        id,
        created_at,
        sender_id,
        recipient_id,
        content,
        is_admin_message,
        sender_profile:sender_id(first_name, last_name, email),
        recipient_profile:recipient_id(first_name, last_name, email)
      `)
      .or(`sender_id.eq.${ownerId},recipient_id.eq.${ownerId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ error: 'Failed to fetch chat history.' });
    }

    // Agrupar mensagens por thread (por cliente)
    const threads = {};
    const clients = new Set();
    
    messages.forEach(msg => {
      const clientId = msg.sender_id === ownerId ? msg.recipient_id : msg.sender_id;
      const clientProfile = msg.sender_id === ownerId ? msg.recipient_profile : msg.sender_profile;
      
      if (!clients.has(clientId)) {
        clients.add(clientId);
        threads[clientId] = {
          id: clientId,
          name: clientProfile ? `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() || 'Cliente' : 'Cliente',
          lastMessage: {
            text: msg.content,
            timestamp: msg.created_at,
            sender: msg.sender_id === ownerId ? 'owner' : 'client'
          },
          unreadCount: 0,
          messages: []
        };
      }
      
      const thread = threads[clientId];
      thread.messages.push({
        id: msg.id,
        sender: msg.sender_id === ownerId ? 'owner' : 'client',
        text: msg.content,
        timestamp: msg.created_at
      });
      
      // Atualizar última mensagem
      if (new Date(msg.created_at) > new Date(thread.lastMessage.timestamp)) {
        thread.lastMessage = {
          text: msg.content,
          timestamp: msg.created_at,
          sender: msg.sender_id === ownerId ? 'owner' : 'client'
        };
      }
      
      // Contar não lidas (mensagens de cliente que não são do owner)
      if (msg.sender_id !== ownerId && !msg.is_admin_message) {
        thread.unreadCount++;
      }
    });

    const chatHistory = Object.values(threads);
    
    res.status(200).json(chatHistory);
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    res.status(500).json({ error: 'Failed to fetch chat history.' });
  }
};

module.exports = {
  getOwnerMetrics,
  getMercadoPagoAuthUrl,
  handleMercadoPagoCallback,
  disconnectMercadoPago,
  getChatHistory,
};