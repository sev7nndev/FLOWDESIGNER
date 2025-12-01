// backend/server.cjs
const express = require('express');
const cors = require('cors');
// CORREÇÃO: Importando do config.cjs
const { supabaseAnon, PRO_LIMIT, STARTER_LIMIT, FREE_LIMIT } = require('./config.cjs'); 
const generationRoutes = require('./routes/generationRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
// NOVO: Importando o middleware de autenticação
const { authenticateToken } = require('./middleware/auth.cjs'); 

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    // CORREÇÃO CRÍTICA: Adicionando a porta 3000 (Vite default)
    origin: ['http://localhost:5173', 'http://localhost:3000'], 
    methods: ['GET', 'POST', 'DELETE'], // Adicionado DELETE para rotas admin
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

// --- Quota/Usage Endpoint (Requires Authentication) ---
// CORREÇÃO: Adicionando authenticateToken
app.get('/api/usage/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const user = req.user; // Obtido do middleware authenticateToken

    // CRITICAL CHECK: Ensure the requested userId matches the authenticated user's ID
    if (userId !== user.id) {
        return res.status(403).json({ error: 'Acesso negado. Você só pode consultar seu próprio uso.' });
    }

    try {
        // 1. Get Role from profiles
        // Usamos supabaseAnon aqui, mas como o token foi verificado no middleware,
        // a requisição para o Supabase API precisa do token para passar pelo RLS.
        // Como o backend não tem o token do usuário, precisamos usar o Service Key
        // para buscar o perfil, ou refatorar o frontend para passar o token.
        
        // ALTERNATIVA: Usar o Service Key para buscar o perfil (já que o usuário foi autenticado)
        const { supabaseService } = require('./config.cjs'); // Importa o service client
        
        const { data: profileData, error: profileError } = await supabaseService
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
            
        const role = profileData?.role || 'free';

        // 2. Get Usage Count from user_usage
        const { data: usageData, error: usageError } = await supabaseService // Usando Service Key
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
        // Se ocorrer um erro (ex: perfil não encontrado), retorna 500
        console.error('Error fetching usage data:', error);
        res.status(500).json({
            error: 'Falha ao buscar dados de uso.',
        });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});