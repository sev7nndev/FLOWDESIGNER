const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

// Fix the Guardian run-cycle endpoint to handle getMPToken safely
const fixedGuardianRunCycle = `// Guardian Run Cycle (Activate System)
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

    // 3. Mercado Pago - Safe check without calling getMPToken
    try {
      const { data: mpConfig } = await globalSupabase
        .from('app_config')
        .select('value')
        .eq('key', 'mp_access_token')
        .maybeSingle();
      
      checks.push({ name: 'Mercado Pago', status: mpConfig?.value ? 'ACTIVE' : 'OFFLINE' });
    } catch (e) {
      checks.push({ name: 'Mercado Pago', status: 'OFFLINE' });
    }

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
});`;

// Find and replace the Guardian run-cycle endpoint
const guardianPattern = /\/\/ Guardian Run Cycle \(Activate System\)[\\s\\S]*?app\.post\('\/api\/admin\/guardian\/run-cycle'[\\s\\S]*?\}\);/;

if (guardianPattern.test(content)) {
    content = content.replace(guardianPattern, fixedGuardianRunCycle);
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log("✅ Guardian run-cycle endpoint fixed!");
} else {
    console.log("⚠️ Guardian endpoint not found or already fixed");
}
