const express = require('express');
const cors = require('cors');
const { supabaseAnon, PRO_LIMIT, STARTER_LIMIT, FREE_LIMIT } = require('./config');
const generationRoutes = require('./routes/generationRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const planRoutes = require('./routes/planRoutes.cjs');
const historyRoutes = require('./routes/historyRoutes.cjs');
const configRoutes = require('./routes/configRoutes.cjs');
const devRoutes = require('./routes/devRoutes.cjs');
const paymentRoutes = require('./routes/paymentRoutes.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-production-domain.com' // Add your production domain
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Flow Designer Backend is running.',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// API Routes
app.use('/api/generation', generationRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/payments', paymentRoutes);

// Usage endpoint
app.get('/api/usage/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Get user profile
    const { data: profileData, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const role = profileData?.role || 'free';

    // Get current usage
    const { data: usageData, error: usageError } = await supabaseAnon
      .from('user_usage')
      .select('current_usage')
      .eq('user_id', userId)
      .single();

    const current_usage = usageData?.current_usage || 0;

    // Determine limits
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
      usagePercentage: isUnlimited ? 0 : Math.min((current_usage / limit) * 100, 100),
      isBlocked: !isUnlimited && current_usage >= limit
    });
  } catch (error) {
    console.error('Usage endpoint error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de uso.' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado.' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }
  
  res.status(500).json({ 
    error: 'Erro interno do servidor.',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});