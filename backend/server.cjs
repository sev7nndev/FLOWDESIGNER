// backend/server.cjs
const express = require('express');
const cors = require('cors');
const { supabaseAnon, PRO_LIMIT, STARTER_LIMIT, FREE_LIMIT } = require('./config'); // Import the anonymous client and limits
const generationRoutes = require('./routes/generationRoutes'); // Import the new routes
const ownerRoutes = require('./routes/ownerRoutes'); // NOVO: Importando rotas do proprietário
const adminRoutes = require('./routes/adminRoutes'); // NOVO: Importando rotas do Admin

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

// --- Public Routes (e.g., Health Check) ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'AI Art Generator Backend is running.' });
});

// --- API Routes ---
// Use the modularized generation routes
app.use('/api/generation', generationRoutes);
// NOVO: Rotas do Proprietário
app.use('/api/owner', ownerRoutes);
// NOVO: Rotas do Administrador
app.use('/api/admin', adminRoutes);


// --- Quota/Usage Endpoint (Public, but requires user ID/token for data retrieval) ---
app.get('/api/usage/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // 1. Get Role from profiles
        const { data: profileData, error: profileError } = await supabaseAnon
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
            
        const role = profileData?.role || 'free';

        // 2. Get Usage Count from user_usage
        const { data: usageData, error: usageError } = await supabaseAnon
            .from('user_usage')
            .select('current_usage')
            .eq('user_id', userId)
            .single();
            
        const current_usage = usageData?.current_usage || 0;

        // Define limits based on role (must match backend/services/generationService.cjs)
        let limit = 0;
        let isUnlimited = false;

        switch (role) {
            case 'owner':
            case 'dev':
            case 'admin':
                isUnlimited = true;
                break;
            case 'pro':
                limit = PRO_LIMIT; 
                break;
            case 'starter':
                limit = STARTER_LIMIT;
                break;
            case 'free':
            default:
                limit = FREE_LIMIT;
                break;
        }

        res.status(200).json({
            role,
            current: current_usage,
            limit,
            isUnlimited,
        });

    } catch (error) {
        // If any error occurs (e.g., user not found in profiles/usage), return default free plan
        console.error('Error fetching usage data:', error);
        res.status(200).json({
            role: 'free',
            current: 0,
            limit: FREE_LIMIT,
            isUnlimited: false,
        });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});