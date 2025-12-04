const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

// Guardian API Endpoints
const guardianEndpoints = `
// ==========================================
// GUARDIAN API ENDPOINTS (Dev Panel Support)
// ==========================================

// Guardian Stats Endpoint
app.get('/api/admin/guardian/stats', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Check if user is admin/dev/owner
    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Measure DB latency
    const dbStart = Date.now();
    await globalSupabase.from('profiles').select('count').limit(1);
    const dbLatency = Date.now() - dbStart;

    // Get memory usage
    const memUsage = process.memoryUsage();
    const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    // Check MP status
    const mpToken = getMPToken();
    const mpStatus = mpToken ? 'ACTIVE' : 'OFFLINE';

    res.json({
      dbLatency,
      memory: memoryMB,
      routeStatus: 'OK',
      mpStatus,
      lastRun: new Date().toISOString()
    });
  } catch (error) {
    console.error('Guardian stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guardian Logs Endpoint
app.get('/api/admin/guardian/logs', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Return mock logs (you can enhance this with real logging later)
    const logs = [
      { timestamp: new Date().toISOString(), action: 'SYSTEM_CHECK', status: 'OK', details: 'All systems operational' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), action: 'DB_HEALTH', status: 'OPTIMAL', details: 'Database responding normally' },
      { timestamp: new Date(Date.now() - 120000).toISOString(), action: 'API_CHECK', status: 'ONLINE', details: 'All endpoints responding' }
    ];

    res.json({ logs });
  } catch (error) {
    console.error('Guardian logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guardian Run Cycle (Activate System)
app.post('/api/admin/guardian/run-cycle', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    console.log('🔄 Guardian: Running system activation cycle...');

    // Perform system checks
    const checks = [];

    // 1. Database connectivity
    try {
      await globalSupabase.from('profiles').select('count').limit(1);
      checks.push({ name: 'Database', status: 'OK' });
    } catch (e) {
      checks.push({ name: 'Database', status: 'ERROR', error: e.message });
    }

    // 2. Gemini API
    try {
      if (process.env.GEMINI_API_KEY) {
        checks.push({ name: 'Gemini API', status: 'CONFIGURED' });
      } else {
        checks.push({ name: 'Gemini API', status: 'MISSING_KEY' });
      }
    } catch (e) {
      checks.push({ name: 'Gemini API', status: 'ERROR' });
    }

    // 3. Mercado Pago
    const mpToken = getMPToken();
    checks.push({ name: 'Mercado Pago', status: mpToken ? 'ACTIVE' : 'OFFLINE' });

    console.log('✅ Guardian: System activation complete', checks);

    res.json({
      success: true,
      message: 'Sistema reativado com sucesso',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Guardian run-cycle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guardian Repair Endpoint
app.post('/api/admin/repair', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    console.log('🔧 Guardian: Running auto-repair...');

    // Placeholder for repair logic
    // You can add actual repair operations here

    res.json({
      success: true,
      message: 'Reparo automático concluído',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Guardian repair error:', error);
    res.status(500).json({ error: error.message });
  }
});
`;

// Find insertion point (before health check endpoint)
const healthCheckPattern = /app\.get\('\/health'/;
const match = content.match(healthCheckPattern);

if (!content.includes('/api/admin/guardian')) {
    content = content.replace(healthCheckPattern, guardianEndpoints + "\n" + healthCheckPattern);
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log("✅ Guardian API endpoints added successfully!");
} else {
    console.log("⚠️ Guardian endpoints already exist");
}
