// backend/server.cjs
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // Import rate-limiter
const { supabaseAnon, PRO_LIMIT, STARTER_LIMIT, FREE_LIMIT } = require('./config'); // Import the anonymous client and limits
const generationRoutes = require('./routes/generationRoutes'); // Import the new routes
const ownerRoutes = require('./routes/ownerRoutes'); // Importando rotas do proprietário
const adminRoutes = require('./routes/adminRoutes'); // Importando rotas do Admin
const publicRoutes = require('./routes/publicRoutes'); // NOVO: Importando rotas públicas

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    // CORREÇÃO CRÍTICA: Adicionando a porta 3000 (Vite default)
    origin: ['http://localhost:5173', 'http://localhost:3000'], 
    methods: ['GET', 'POST', 'DELETE'], // Adicionando DELETE para rotas admin
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// --- Security: Rate Limiting ---
// Apply a rate limit to all API requests to prevent abuse
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter); // Apply the rate limiting middleware to all API routes


// --- Public Routes (e.g., Health Check) ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'AI Art Generator Backend is running.' });
});

// --- API Routes ---
// Use the modularized generation routes
app.use('/api/generation', generationRoutes);
// Rotas do Proprietário
app.use('/api/owner', ownerRoutes);
// Rotas do Administrador
app.use('/api/admin', adminRoutes);
// NOVO: Rotas Públicas (Montadas)
app.use('/api', publicRoutes);


// --- Quota/Usage Endpoint (REMOVIDO: O frontend agora usa o cliente Supabase autenticado, protegido por RLS) ---
// O endpoint /api/usage/:userId foi removido para evitar exposição de IDs de usuário e depender
// exclusivamente do RLS do Supabase para controle de acesso.

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});