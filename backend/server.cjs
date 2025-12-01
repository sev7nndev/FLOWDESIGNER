// backend/server.cjs
const express = require('express');
const cors = require('cors');
const { supabaseAnon, PRO_LIMIT, STARTER_LIMIT, FREE_LIMIT } = require('./config.cjs');
const generationRoutes = require('./routes/generationRoutes.cjs');
const adminRoutes = require('./routes/adminRoutes.cjs');
const paymentRoutes = require('./routes/paymentRoutes.cjs'); // Importando rotas de pagamento

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], 
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rota de webhook precisa do corpo bruto (raw), então vem antes do express.json()
app.use('/api/payments/webhook', paymentRoutes);

app.use(express.json({ limit: '5mb' })); // Aumentando o limite para upload de logo

// --- API Routes ---
app.use('/api', generationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes); // Usando as rotas de pagamento

// --- Public Routes ---
app.get('/api/history', require('./middleware/auth.cjs').authenticateToken, async (req, res) => {
    // ... (código existente)
});
app.get('/api/landing-images', async (req, res) => {
    // ... (código existente)
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});