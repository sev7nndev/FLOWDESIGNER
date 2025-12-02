const express = require('express');
const cors = require('cors');
const { supabaseAnon, supabaseService } = require('./config'); // Adicionado supabaseService
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
    'https://your-production-domain.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

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
    console.log('📊 Fetching usage for user:', userId);
    
    // Fetch usage data including plan settings
    const { data: usageData, error: usageError } = await supabaseAnon
      .from('user_usage')
      .select(`
        current_usage,
        profiles (role),
        plan_settings (max_images_per_month)
      `)
      .eq('user_id', userId)
      .single();

    if (usageError || !usageData || !usageData.profiles) {
      // If no usage data found, assume free plan default
      const { data: profileData } = await supabaseAnon
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
      const role = profileData?.role || 'free';
      const limit = role === 'free' ? 3 : 0; // Default free limit if no usage record exists
      
      return res.status(200).json({
        role,
        current: 0,
        limit,
        isUnlimited: ['owner', 'dev', 'admin'].includes(role),
        usagePercentage: 0,
        isBlocked: false
      });
    }

    const role = usageData.profiles.role || 'free';
    const current_usage = usageData.current_usage || 0;
    
    let limit = (usageData.plan_settings && usageData.plan_settings.max_images_per_month) || 0;
    let isUnlimited = ['owner', 'dev', 'admin'].includes(role);
    
    // Fallback for free plan if plan_settings is missing
    if (role === 'free' && limit === 0) {
        limit = 3;
    }

    const usagePercentage = isUnlimited || limit === 0 ? 0 : Math.min((current_usage / limit) * 100, 100);
    const isBlocked = !isUnlimited && limit > 0 && current_usage >= limit;

    const result = {
      role,
      current: current_usage,
      limit,
      isUnlimited,
      usagePercentage,
      isBlocked
    };

    console.log('✅ Usage data:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Usage endpoint error:', error.message);
    res.status(500).json({ error: 'Erro ao buscar dados de uso.' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Endpoint não encontrado.' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  // Se a resposta já foi enviada, não podemos fazer nada
  if (res.headersSent) {
    return next(error);
  }
  
  const statusCode = error.statusCode || 500;
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }
  
  res.status(statusCode).json({ 
    error: error.message || 'Erro interno do servidor.',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔗 Available endpoints:');
  console.log('   GET  / - Health check');
  console.log('   GET  /api/plans - Get plans');
  console.log('   POST /api/generation/generate - Generate image');
  console.log('   GET  /api/owner/metrics - Owner metrics');
  console.log('   GET  /api/usage/:userId - User usage');
});