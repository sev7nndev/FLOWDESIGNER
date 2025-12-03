const express = require('express');
const cors = require('cors');
const config = require('./config.cjs'); // Loads environment and initializes clients

// Import Routes
const generationRoutes = require('./routes/generation.cjs');
const quotaRoutes = require('./routes/quota.cjs');
const subscriptionRoutes = require('./routes/subscription.cjs');
const adminRoutes = require('./routes/admin.cjs');

const app = express();
const PORT = config.PORT;

// --- Configuração de CORS Restrita ---
const ALLOWED_ORIGINS = [
  'http://localhost:3000', 
  'https://ai.studio', 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Aumentando o limite para 50mb para acomodar o logo em base64, se necessário.
app.use(express.json({ limit: '50mb' })); 
app.set('trust proxy', 1);

// --- ROTAS ---
app.use('/api/generate', generationRoutes);
app.use('/api/check-quota', quotaRoutes);
app.use('/api/subscribe', subscriptionRoutes);
app.use('/api/admin', adminRoutes); // All admin routes are prefixed with /api/admin

// --- Rota de Health Check ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'Flow Designer Backend' });
});

// --- Error handler ---
app.use((err, req, res, next) => {
    console.error("[ERRO GLOBAL]", err);
    res.status(500).json({ error: err.message || 'Erro interno.' });
});

// --- Start server ---
app.listen(PORT, () => {
    console.log(`Flow Designer Backend running on port ${PORT}`);
});