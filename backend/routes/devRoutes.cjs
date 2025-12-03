const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabaseService } = require('../config');

// Middleware to check if user is dev or admin
const checkDevRole = async (req, res, next) => {
  const user = req.user;
  
  if (!user || !user.profile) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const { role } = user.profile;
  
  if (role !== 'dev' && role !== 'admin' && role !== 'owner') {
    return res.status(403).json({ error: 'Acesso negado. Apenas desenvolvedores podem acessar.' });
  }

  next();
};

// Get system metrics
router.get('/metrics', authenticateToken, checkDevRole, async (req, res) => {
  try {
    // Get user counts by role
    const { data: userCounts, error: userError } = await supabaseService
      .from('profiles')
      .select('role')
      .then(({ data }) => {
        const counts = data.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        return { data: counts };
      });

    // Get total generations
    const { count: totalGenerations, error: genError } = await supabaseService
      .from('image_generations')
      .select('*', { count: 'exact', head: true });

    // Get active subscriptions
    const { count: activeSubs, error: subError } = await supabaseService
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get storage usage
    const { data: storageFiles, error: storageError } = await supabaseService.storage
      .from('generated-arts')
      .list('', { limit: 1000 });

    const storageUsage = storageFiles?.length || 0;

    res.status(200).json({
      users: userCounts.data || {},
      totalGenerations: totalGenerations || 0,
      activeSubscriptions: activeSubs || 0,
      storageUsage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dev metrics error:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas.' });
  }
});

// Get recent activities
router.get('/activities', authenticateToken, checkDevRole, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // Get recent image generations
    const { data: recentGenerations, error: genError } = await supabaseService
      .from('image_generations')
      .select(`
        *,
        profiles!inner(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (genError) {
      console.error('Activities fetch error:', genError);
      return res.status(500).json({ error: 'Erro ao buscar atividades.' });
    }

    res.status(200).json(recentGenerations || []);
  } catch (error) {
    console.error('Activities endpoint error:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Get system health
router.get('/health', authenticateToken, checkDevRole, async (req, res) => {
  try {
    const health = {
      database: 'healthy',
      storage: 'healthy',
      api: 'healthy',
      timestamp: new Date().toISOString()
    };

    // Test database connection
    try {
      await supabaseService.from('profiles').select('id').limit(1);
    } catch (error) {
      health.database = 'unhealthy';
    }

    // Test storage connection
    try {
      await supabaseService.storage.from('generated-arts').list('', { limit: 1 });
    } catch (error) {
      health.storage = 'unhealthy';
    }

    res.status(200).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      database: 'unhealthy',
      storage: 'unhealthy',
      api: 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;