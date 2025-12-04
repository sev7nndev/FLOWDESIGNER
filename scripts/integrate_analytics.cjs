const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Add analytics import
const analyticsImport = `const { trackEvent, getMetrics, getRecentEvents } = require('./services/analyticsService.cjs');`;
const importInsertPoint = "const { GoogleGenerativeAI } = require('@google/generative-ai');";

if (!content.includes("analyticsService")) {
    content = content.replace(importInsertPoint, importInsertPoint + "\n" + analyticsImport);
    console.log("✅ Added analytics service import");
} else {
    console.log("⚠️ Analytics service already imported");
}

// 2. Add analytics endpoint
const analyticsEndpoint = `
// Analytics endpoint (admin only)
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Check if user is admin/owner/dev
    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const metrics = getMetrics(startDate, endDate);
    const recentEvents = getRecentEvents(50);

    res.json({ metrics, recent_events: recentEvents });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});
`;

// Find a good place to insert (before the health check endpoint)
const healthCheckPattern = /app\.get\('\/health'/;
if (!content.includes("/api/admin/analytics")) {
    content = content.replace(healthCheckPattern, analyticsEndpoint + "\n" + healthCheckPattern);
    console.log("✅ Added analytics endpoint");
} else {
    console.log("⚠️ Analytics endpoint already exists");
}

// 3. Add tracking to generation endpoint
const generationSuccessPattern = /res\.json\(\{ image: \{ id: 'generated', image_url: imageUrl \} \}\);/;
if (generationSuccessPattern.test(content) && !content.includes("trackEvent('generation'")) {
    content = content.replace(generationSuccessPattern,
        `trackEvent('generation', user.id, { style: selectedStyle });\n    res.json({ image: { id: 'generated', image_url: imageUrl } });`
    );
    console.log("✅ Added generation tracking");
} else {
    console.log("⚠️ Generation tracking already added or pattern not found");
}

// 4. Add tracking to registration
const registerSuccessPattern = /res\.json\(\{ user: newUser \}\);/;
if (registerSuccessPattern.test(content) && !content.includes("trackEvent('registration'")) {
    const registerTracking = `trackEvent('registration', newUser.id, { plan: 'free' });\n    `;
    content = content.replace(registerSuccessPattern, registerTracking + registerSuccessPattern);
    console.log("✅ Added registration tracking");
} else {
    console.log("⚠️ Registration tracking already added or pattern not found");
}

// Write back
fs.writeFileSync(serverPath, content, 'utf8');
console.log("✅ Server.cjs updated with analytics");
