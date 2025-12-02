const ownerService = require('../services/ownerService');

const getOwnerMetrics = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const metrics = await ownerService.fetchOwnerMetrics(ownerId);
    
    if (!metrics || typeof metrics !== 'object') {
      return res.status(500).json({ error: "Invalid metrics structure." });
    }
    
    return res.status(200).json(metrics);
  } catch (error) {
    console.error("Error in getOwnerMetrics controller:", error.message);
    return res.status(500).json({ 
      error: "Failed to load data from server.",
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
  if (!code || !state) {
    return res.status(400).send("Missing authorization code or state.");
  }

  try {
    await ownerService.handleMercadoPagoCallback(code, state);
    res.redirect('/owner/dashboard?mp_status=success');
  } catch (error) {
    console.error("Error handling MP callback:", error);
    res.redirect('/owner/dashboard?mp_status=error&message=' + encodeURIComponent(error.message));
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
    const chatHistory = await ownerService.getOwnerChatHistory(ownerId);
    res.status(200).json(chatHistory);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history." });
  }
};

module.exports = {
  getOwnerMetrics,
  getMercadoPagoAuthUrl,
  handleMercadoPagoCallback,
  disconnectMercadoPago,
  getChatHistory,
};