// backend/server.cjs
const express = require('express');
const cors = require('cors');
const { supabaseAnon, PRO_LIMIT, STARTER_LIMIT, FREE_LIMIT } = require('./config');
const generationRoutes = require('./routes/generationRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const planRoutes = require('./routes/planRoutes.cjs');
const historyRoutes = require('./routes/historyRoutes.cjs');
const configRoutes = require('./routes/configRoutes.cjs'); // NOVO: Importando rotas de configuração

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'AI Art Generator Backend is running.' });
});

// --- API Routes ---
app.use('/api/generation', generationRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/config', configRoutes); // NOVO: Registrando rotas de configuração

// --- Quota/Usage Endpoint ---
app.get('/api/usage/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: profileData, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const role = profileData?.role || 'free';

    const { data: usageData, error: usageError } = await supabaseAnon
      .from('user_usage')
      .select('current_usage')
      .eq('user_id', userId)
      .single();

    const current_usage = usageData?.current_usage || 0;

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
    console.error('Error fetching usage data:', error);
    res.status(200).json({
      role: 'free',
      current: 0,
      limit: FREE_LIMIT,
      isUnlimited: false,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});