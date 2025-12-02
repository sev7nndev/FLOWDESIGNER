// backend/controllers/ownerController.cjs
const ownerService = require('../services/ownerService');

const getOwnerMetrics = async (req, res) => {
  try {
    // Assumindo que req.user.id é populado corretamente pelo middleware
    const ownerId = req.user.id;
    const metrics = await ownerService.fetchOwnerMetrics(ownerId);

    // Verificação de segurança para garantir que o serviço retornou um objeto
    if (!metrics || typeof metrics !== 'object') {
      console.warn("Owner service returned invalid data structure.");
      return res.status(500).json({ error: "Internal server error: Invalid metrics structure." });
    }

    return res.status(200).json(metrics);
  } catch (error) {
    console.error("Error in getOwnerMetrics controller:", error.message, error.stack);
    // FIX CRÍTICO: Sempre enviar uma resposta JSON em caso de erro para evitar corpo vazio.
    return res.status(500).json({ error: "Failed to load data from server. Check backend logs for details.", details: error.message });
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
    // Redirect to the dashboard after successful connection
    res.redirect('/owner/dashboard?mp_status=success');
  } catch (error) {
    console.error("Error handling MP callback:", error);
    // Redirect with an error status
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

module.exports = {
  getOwnerMetrics,
  getMercadoPagoAuthUrl,
  handleMercadoPagoCallback,
  disconnectMercadoPago,
};