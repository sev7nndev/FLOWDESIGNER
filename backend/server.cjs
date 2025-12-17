const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { trackEvent, getMetrics, getRecentEvents } = require('./services/analyticsService.cjs');
const { generalLimiter, generationLimiter, authLimiter, paymentLimiter } = require('./services/rateLimitService.cjs');
const { webhookValidationMiddleware } = require('./services/webhookSecurity.cjs');
const { sendWelcomeEmail, sendPaymentConfirmation, sendQuotaAlert } = require('./services/emailService.cjs');
const mercadopago = require('mercadopago');
const axios = require('axios');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// const ADVANCED_PROMPT_SYSTEM = require('./advanced_prompt_system.cjs'); // DEPRECATED
const generateRoute = require('./routes/generate.cjs');


const fs = require('fs');
const { startCron } = require('./cron/reset-monthly-credits.cjs');

// Load Env
const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath }); // Load .env first
dotenv.config({ path: envLocalPath }); // Override with .env.local if exists

console.log('?? Server starting...');
console.log('?? Loading env from:', envPath);
console.log('?? Supabase URL present:', !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL));
console.log('?? Service Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// QA Logging Helper
const LOG_FILE = path.resolve(__dirname, 'qa-logs.json');
const logQA = (entry) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
  } catch (e) {
    console.error('Logging failed:', e);
  }
};

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://flowdesigner-saas.vercel.app',
    'https://flow-designer.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(generalLimiter); // Rate limiting for all routes
app.use(express.json({ limit: '50mb' }));

// --- CONFIG ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// CRITICAL: Validate required environment variables
const requiredEnvVars = {
  'SUPABASE_URL': SUPABASE_URL,
  'SUPABASE_ANON_KEY': SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': SUPABASE_SERVICE_KEY,
  'GEMINI_API_KEY': GEMINI_API_KEY
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('? FATAL: Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\n?? Check your .env file and ensure all variables are set.');
  process.exit(1);
}

console.log('? All required environment variables present');


// Global Client (Simple configuration - no extra overhead)
const globalSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

// GenAI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const activeModel = "imagen-4.0-generate-001"; // Imagen 4.0 (Latest)

// --- PERSISTENT DB CONNECTION MANAGER ---
const maintainSupabaseConnection = async () => {
  console.log('🔌 Inicializando conexão persistente com Supabase...');

  const pingDB = async () => {
    try {
      const start = Date.now();
      const { data, error } = await globalSupabase.from('profiles').select('id').limit(1);

      if (error) {
        throw error;
      }

      const latency = Date.now() - start;
      console.log(`[${new Date().toLocaleTimeString()}] 💓 Supabase Connection OK (${latency}ms)`);
      return true;
    } catch (e) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Supabase Connection LOST:`, e.message);
      console.log('🔄 Tentando reconectar em 5 segundos...');
      return false;
    }
  };

  // Initial Ping
  let connected = await pingDB();

  // Retry Loop for Initial Connection
  while (!connected) {
    await new Promise(r => setTimeout(r, 5000));
    connected = await pingDB();
  }

  // Persistent Keep-Alive Loop (Every 4 minutes)
  // Prevents "idle" disconnects from serverless DBs
  setInterval(async () => {
    await pingDB();
  }, 4 * 60 * 1000);

  console.log('✅ Sistema de Persistência de Banco de Dados: ATIVO');
  console.log('✅ O banco de dados permanecerá conectado enquanto o servidor estiver rodando.');
};

// Start Connection Manager
maintainSupabaseConnection();

// --- HELPERS ---
const getAuthUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  const { data: { user }, error } = await globalSupabase.auth.getUser(token);
  return user;
};

// --- DEBUG ROUTE (Temporary) ---
app.get('/api/debug-connection', async (req, res) => {
  try {
    const isServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { data: profiles, error } = await globalSupabase.from('profiles').select('*');

    // Check key start (safe log)
    const keyStart = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) : 'NONE';

    res.json({
      status: 'online',
      using_service_key: isServiceKey,
      key_preview: keyStart + '...',
      profiles_count: profiles?.length || 0,
      db_error: error,
      url: process.env.SUPABASE_URL
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- ROUTES ---

// 1. Image Generation Route (UNIFIED)
app.use('/api/generate', generateRoute);

// DEPRECATED: /api/generate-ultra
// All logic moved to /api/generate which is now intelligent
app.post('/api/generate-ultra', async (req, res) => {
  // Redirect logic or simple error
  res.redirect(307, '/api/generate'); 
});

// 1.5. Enhance Prompt Route
app.post('/api/enhance-prompt', generationLimiter, async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const enhancementPrompt = `Você é um Copywriter Especialista em Marketing de Varejo. Melhore o texto abaixo para um panfleto comercial.
    
    Texto Original: "${prompt}"
    
    REGRAS OBRIGATÓRIAS:
    1. Melhore a persuasão e a clareza para vender.
    2. Identifique os serviços/produtos principais e liste-os de forma atraente.
    3. Crie uma frase de destaque (Headline) forte.
    4. NÃO inclua instruções visuais (ex: "use cores vermelhas", "imagem de fundo"). O Designer já sabe disso.
    5. NÃO descreva a imagem. Apenas forneça o TEXTO que vai escrito na arte.
    6. Mantenha o texto curto e direto, adequado para um flyer.
    7. NÃO use "Sugestão de imagem:".
    
    Saída esperada: Apenas o texto comercial final melhorado.`;


    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: enhancementPrompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const enhanced = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
    res.json({ enhancedPrompt: enhanced });
  } catch (err) {
    console.error('Enhance Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. QA Dashboard Route
app.get('/api/admin/qa-logs', async (req, res) => {
  if (fs.existsSync(LOG_FILE)) {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const logs = content.trim().split('\n').map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
    res.json({ logs });
  } else {
    res.json({ logs: [] });
  }
});

// 3. Check Quota Route (Real Implementation)
app.get('/api/check-quota', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const globalSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    // Get User Role
    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'free';

    // Check if user has unlimited generation (dev/owner/admin)
    const hasUnlimitedGeneration = role === 'owner' || role === 'dev' || role === 'admin';

    if (hasUnlimitedGeneration) {
      return res.json({
        status: 'ALLOWED',
        usage: { current_usage: 0, plan_id: role },
        plan: { id: role, max_images_per_month: 999999, price: 0 }
      });
    }

    // Get Usage for regular users (free/starter/pro)
    const { data: usageData } = await globalSupabase
      .from('user_usage')
      .select('images_generated')
      .eq('user_id', user.id)
      .single();

    const currentUsage = usageData?.images_generated || 0;

    // Get Plan Limits
    const { data: planSettings } = await globalSupabase
      .from('plan_settings')
      .select('max_images_per_month, price')
      .eq('id', role)
      .single();

    const limit = planSettings?.max_images_per_month || (role === 'pro' ? 50 : (role === 'starter' ? 20 : 3));
    const status = currentUsage >= limit ? 'BLOCKED' : 'ALLOWED';

    res.json({
      status,
      usage: { current_usage: currentUsage, plan_id: role },
      plan: { id: role, max_images_per_month: limit, price: planSettings?.price || 0 }
    });


  } catch (error) {
    console.error('Check Quota Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 5. Admin: Create User
app.post('/api/admin/create-user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    // 1. Verify Caller is Admin (Using Helper)
    const caller = await getAuthUser(req);
    if (!caller) {
      console.warn('CreateUser: Token Invalid or Expired');
      return res.status(401).json({ error: 'Unauthorized: Invalid Token' });
    }

    const { data: callerProfile } = await globalSupabase.from('profiles').select('role').eq('id', caller.id).single();

    // Allow 'dev' role as well for testing
    if (!['owner', 'admin', 'dev'].includes(callerProfile?.role)) {
      console.warn(`CreateUser: Forbidden access attempt by ${caller.id} (${callerProfile?.role})`);
      return res.status(403).json({ error: 'Forbidden: Only Owners/Admins can create users.' });
    }

    const { email, password, firstName, lastName, plan } = req.body;

    // 2. Create Auth User (Using Service Role)
    const { data: newUser, error: createError } = await globalSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    });

    if (createError) throw createError;

    // 3. Create Profile
    const { error: profileError } = await globalSupabase.from('profiles').upsert({
      id: newUser.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role: 'free', // SECURITY: Always start as free, upgrade only via webhook
      updated_at: new Date().toISOString()
    });

    if (profileError) throw profileError;

    // 4. Force Plan if requested
    if (plan && plan !== 'free') {
      await globalSupabase.from('profiles').update({ role: plan }).eq('id', newUser.user.id);

      // Init usage with limits
      const limit = plan === 'pro' ? 50 : (plan === 'starter' ? 20 : 3);
      await globalSupabase.from('user_usage').insert({
        user_id: newUser.user.id,
        images_generated: 0,
        plan_id: plan,
        cycle_start_date: new Date().toISOString()
      });
    }

    res.json({ success: true, user: newUser.user });

  } catch (e) {
    console.error('Create User Error Details:', JSON.stringify(e, null, 2));
    console.error('Create User Error Message:', e.message);
    res.status(500).json({ error: e.message || "Erro desconhecido ao criar usuário." });
  }
});

// 4.1 Admin: List Users
app.get('/api/admin/users', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!['owner', 'admin', 'dev'].includes(profile?.role)) return res.status(403).json({ error: 'Forbidden' });

    // 1. Fetch ALL profiles (Service Role - No RLS) - Exclude internal roles
    const { data: users, error: usersError } = await globalSupabase
      .from('profiles')
      .select('*')
      .neq('role', 'owner')
      .neq('role', 'dev')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // 2. Fetch ALL usages
    const { data: usages, error: usageError } = await globalSupabase
      .from('user_usage')
      .select('user_id, images_generated');

    // 3. Merge in memory (Robust against FK issues)
    const usersWithUsage = users.map(u => {
      const usage = usages?.find(us => us.user_id === u.id);
      return {
        ...u,
        images_generated: usage ? usage.images_generated : 0
      };
    });

    res.json({ users: usersWithUsage });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4.2 Admin: Delete User
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!['owner', 'admin'].includes(profile?.role)) return res.status(403).json({ error: 'Forbidden' });

    const targetId = req.params.id;

    // Delete from Auth (Service Role)
    const { error: authError } = await globalSupabase.auth.admin.deleteUser(targetId);
    if (authError) throw authError;

    // DB Cascade should handle the rest, but let's be safe
    // await globalSupabase.from('profiles').delete().eq('id', targetId);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4.3 Admin: Stats (Alias for Dashboard)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Calculate Revenue from Payments table
    const { data: payments } = await globalSupabase
      .from('payments')
      .select('*')
      .eq('status', 'approved');

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const revenue = {
      day: payments?.filter(p => p.created_at >= startOfDay).reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      week: payments?.filter(p => p.created_at >= startOfWeek).reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      month: payments?.filter(p => p.created_at >= startOfMonth).reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      total: payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    };

    const recentPayments = await globalSupabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({ revenue, payments: recentPayments.data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4.4 Admin: Update Plans (Secure)
app.put('/api/admin/plans', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!['owner', 'admin'].includes(profile?.role)) return res.status(403).json({ error: 'Forbidden' });

    const { plans } = req.body;
    if (!Array.isArray(plans)) return res.status(400).json({ error: 'Invalid plans data' });

    const updates = plans.map(p => ({
      id: p.id,
      price: p.price,
      max_images_per_month: p.max_images_per_month,
      description: p.description,
      display_name: p.display_name,
      features: p.features
    }));

    const { error } = await globalSupabase.from('plan_settings').upsert(updates, { onConflict: 'id' });
    if (error) throw error;

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4.6 Admin: Landing Image Upload
app.post('/api/admin/landing-images/upload', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { fileBase64, fileName, userId } = req.body;

    // Convert Base64 to Buffer
    const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');
    const path = `landing/${Date.now()}_${fileName}`;

    const { data, error } = await globalSupabase.storage
      .from('landing-carousel')
      .upload(path, buffer, {
        contentType: 'image/png', // Assumes PNG/JPG
        upsert: true
      });

    if (error) throw error;

    // Insert into DB registry
    const { data: dbImage, error: dbError } = await globalSupabase
      .from('landing_carousel_images')
      .insert({
        image_url: path,
        uploaded_by: userId,
        sort_order: 0
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Get Public URL
    const { data: { publicUrl } } = globalSupabase.storage.from('landing-carousel').getPublicUrl(path);

    res.json({ image: { ...dbImage, url: publicUrl } });

  } catch (e) {
    console.error('Upload Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// 4.6.5 Admin: Get Landing Images
app.get('/api/admin/landing-images', async (req, res) => {
  try {
    // Public or Admin? Landing page is public, so this should probably be public to render the carousel?
    // But the component is "Manager". Let's verify usage.
    // Ideally GET is public, but this is the admin list.
    // We'll make it public for now so the landing page can use it too without auth.

    const { data: images, error } = await globalSupabase
      .from('landing_carousel_images')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Get Public URLs
    const imagesWithUrls = images.map(img => {
      const { data: { publicUrl } } = globalSupabase.storage.from('landing-carousel').getPublicUrl(img.image_url);
      return { ...img, url: publicUrl };
    });

    res.json(imagesWithUrls);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4.7 Admin: Delete Landing Image
app.delete('/api/admin/landing-images/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // First get the path from DB? Or pass it from client? Client passes it.
    const { imagePath } = req.body; // Ideally should look up by ID to be safe
    const id = req.params.id;

    // Delete from Storage
    if (imagePath) {
      await globalSupabase.storage.from('landing-carousel').remove([imagePath]);
    }

    // Delete from DB
    const { error } = await globalSupabase
      .from('landing_carousel_images')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4.8 Admin-Dev: MP Connect URL
app.get('/api/admin/mp-connect', async (req, res) => {
  try {
    const clientId = process.env.MP_CLIENT_ID;
    const redirectUri = process.env.MP_REDIRECT_URI || 'http://localhost:5173/owner'; // Fallback to dev
    // State should be random token ideally
    const url = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${uuidv4()}&redirect_uri=${redirectUri}`;
    res.json({ connectUrl: url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// 6. Public: Register User (Bypass RLS Triggers)
app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const { data: authData, error: authError } = await globalSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    });


    if (authError) throw authError;

    if (!authData.user) {
      // Limit reached, or email config issue
      return res.status(400).json({ error: 'N�o foi poss�vel criar o usu�rio. Verifique se o email j� existe.' });
    }

    // 2. Insert/Update Profile (Service Role)
    // We try to UPSERT. If it fails (e.g. trigger conflict or RLS), we assume the trigger did its job
    // and proceed without deleting the user.
    const { error: profileError } = await globalSupabase.from('profiles').upsert({
      id: authData.user.id,
      email: email,
      first_name: firstName,
      last_name: lastName || '',
      role: 'free', // SECURITY: Always start as free, upgrade only via webhook // Default to free
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      console.warn("Manual profile upsert failed (likely trigger conflict). Ignoring to allow registration.", profileError);
      // DO NOT delete the user. The user exists, and likely the profile does too (created by trigger).
    }

    // 3. Initialize Usage (Safe to fail too)
    const { error: usageError } = await globalSupabase.from('user_usage').insert({
      user_id: authData.user.id,
      images_generated: 0
    });

    if (usageError) {
      console.warn("Usage creation failed. It might be auto-created.", usageError);
    }

    res.json({ success: true, user: authData.user });

  } catch (e) {
    console.error('Registration Error:', e);

    // Handle specific Supabase duplicate error
    if (e.message?.includes('aligned') || e.message?.includes('already registered')) {
      return res.status(400).json({ error: 'Este email j� est� cadastrado.' });
    }

    res.status(500).json({ error: e.message || 'Erro interno no cadastro.' });
  }
});

// 6. User: Get History (Workaround for browser Supabase client hanging)
app.get('/api/history', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    console.log('📡 /api/history: Fetching history for user:', user.id);

    // Fetch user's images
    const { data: images, error } = await globalSupabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ /api/history: Error fetching images:', error);
      return res.status(500).json({ error: error.message });
    }

    // Map database fields to frontend format
    const mappedImages = images?.map(img => ({
      id: img.id,
      url: img.image_url, // Map image_url to url
      prompt: img.prompt,
      businessInfo: img.business_info,
      createdAt: new Date(img.created_at).getTime()
    })) || [];

    console.log(`✅ /api/history: Returning ${mappedImages.length} images`);
    res.json({ images: mappedImages });
  } catch (e) {
    console.error('❌ /api/history: Exception:', e);
    res.status(500).json({ error: e.message });
  }
});

// 7. User: Delete Image
app.delete('/api/images/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const { id } = req.params;

    const globalSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    // Delete the image (NO counter decrement - user already paid for the generation)
    const { error } = await globalSupabase
      .from('images')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    // ⚠️ IMPORTANT: We do NOT decrement the counter here!
    // Reason: Users are charged per GENERATION, not per saved image.
    // If we decremented, users could:
    // 1. Generate 50 images (hit limit)
    // 2. Delete all 50 images (counter goes back to 0)
    // 3. Generate 50 more images for free (exploit!)
    // 
    // The counter represents "images generated this month", not "images currently saved".

    res.json({ success: true });

  } catch (e) {
    console.error('Delete Image Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 8. User: Subscribe (Payment)
app.post('/api/subscribe', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { planId } = req.body;
    // 1. Try to get Owner Token from DB First
    const { data: ownerAccount } = await createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      .from('owners_payment_accounts')
      .select('mp_access_token')
      .limit(1)
      .maybeSingle();

    const mpToken = ownerAccount?.mp_access_token || process.env.MP_ACCESS_TOKEN;
    if (!mpToken) return res.status(500).json({ error: 'MP Token not configured' });

    // 1. Fetch Plan Details from DB (Dynamic Pricing)
    const { data: planData, error: planError } = await globalSupabase
      .from('plan_settings')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !planData) {
      // Fallback for dev/test if DB entry missing, but warn
      console.warn(`Plan ${planId} not found in DB. Using fallback logic.`);
      if (planId === 'starter') planData = { display_name: 'Plano Starter', price: 29.99, id: 'starter' };
      else if (planId === 'pro') planData = { display_name: 'Plano Pro', price: 49.99, id: 'pro' };
      else return res.status(400).json({ error: 'Plano inválido ou inexistente.' });
    }

    const client = new mercadopago.MercadoPagoConfig({ accessToken: mpToken });
    const preApproval = new mercadopago.PreApproval(client);

    const result = await preApproval.create({
      body: {
        reason: planData.display_name || `Plano ${planData.id}`,
        external_reference: user.id,
        payer_email: user.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: Number(planData.price),
          currency_id: 'BRL'
        },
        back_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
        status: 'pending',
      }
    });

    // Note: PreApproval returns 'init_point' just like Preference
    res.json({ paymentUrl: result.init_point });

  } catch (error) {
    console.error('Subscribe Error:', error);
    res.status(500).json({ error: 'Failed to create payment preference' });
  }
});

// 9. Webhook (Enhanced)
// 9. Webhook (Enhanced)
app.post('/api/webhook', async (req, res) => {
  // try {
    const { topic, id } = req.query;
    const type = topic || req.body?.type;
    const dataId = id || req.body?.data?.id;

    if (!dataId) return res.sendStatus(200);

    console.log(`🔔 Webhook received: ${type} | ID: ${dataId}`);

    // [SECURITY] 0. Always return 200 to MP to prevent retry loops (unless critical infra failure)
    // We will handle logic errors internally.

    try {
        // [IDEMPOTENCY] 1. Check if payment already processed
        // Use a persistent connection to avoid "too many clients" in webhook storms
        const scoped = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        const { data: existingPayment } = await scoped
            .from('payments')
            .select('id')
            .eq('mercadopago_payment_id', String(dataId))
            .limit(1)
            .maybeSingle();

        if (existingPayment) {
            console.log(`⚠️ Payment ${dataId} already processed. Skipping.`);
            return res.sendStatus(200);
        }

        // 2. Get Owner Token
        const { data: ownerAccount } = await scoped
            .from('owners_payment_accounts')
            .select('mp_access_token')
            .limit(1)
            .maybeSingle();

        const mpToken = ownerAccount?.mp_access_token || process.env.MP_ACCESS_TOKEN;

        if (!mpToken) {
            console.error("❌ Webhook Error: MP_ACCESS_TOKEN not configured");
            return res.sendStatus(200); // Return 200 to stop retries, config won't fix itself in 10s
        }

        const client = new mercadopago.MercadoPagoConfig({ accessToken: mpToken });
        const paymentClient = new mercadopago.Payment(client);

        const payment = await paymentClient.get({ id: dataId });

        if (payment && payment.status === 'approved') {
            const userId = payment.external_reference;
            const paidAmount = payment.transaction_amount;
            const metadata = payment.metadata || {};

            console.log(`💰 Payment Approved: R$ ${paidAmount} for User ${userId}`);

            // Determine Plan
            let planId = metadata.plan_id;
            if (!planId) {
                if (paidAmount >= 49) planId = 'pro';
                else if (paidAmount >= 29) planId = 'starter';
                else planId = 'free';
            }

            if (userId) {
                // Update Profile
                await scoped.from('profiles').update({ role: planId }).eq('id', userId);

                // Reset Usage
                await scoped.from('user_usage').update({
                    cycle_start_date: new Date().toISOString()
                }).eq('user_id', userId);

                // Record Payment (Critical for Idempotency)
                await scoped.from('payments').insert({
                    user_id: userId,
                    amount: paidAmount,
                    status: 'approved',
                    mercadopago_payment_id: String(dataId),
                    paid_at: new Date(payment.date_approved || new Date()).toISOString(),
                    plan: planId
                });
                
                console.log(`✅ User ${userId} upgraded to ${planId}`);
            }
        }

        return res.sendStatus(200);

    } catch (error) {
        console.error('❌ Webhook Processing Error:', error.message);
        // Important: Still return 200 to Mercado Pago so they don't spam us
        return res.sendStatus(200);
    }
});


// Health Check Endpoint

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

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Cron endpoint for daily quota reset (called by Vercel Cron)
app.get('/api/cron/reset-quota', async (req, res) => {
  try {
    // Verify request is from Vercel Cron (optional but recommended)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔄 Running daily quota reset...');

    // Reset images_generated for all users
    const { data, error } = await globalSupabase
      .from('user_usage')
      .update({
        images_generated: 0,
        cycle_start_date: new Date().toISOString()
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Update all real users

    if (error) throw error;

    console.log(`✅ Reset quota for ${data?.length || 0} users`);
    res.json({
      success: true,
      message: `Reset quota for ${data?.length || 0} users`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron reset-quota error:', error);
    res.status(500).json({ error: error.message });
  }
});

// === GUARDIAN / DEV PANEL ENDPOINTS ===

// Guardian Stats
app.get('/api/admin/guardian/stats', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const globalSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    const { data: profile } = await globalSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'dev' && profile.role !== 'owner' && profile.role !== 'admin')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Get system stats
    const memoryUsage = process.memoryUsage();
    const dbStart = Date.now();
    await globalSupabase.from('profiles').select('id').limit(1);
    const dbLatency = Date.now() - dbStart;

    res.json({
      dbLatency,
      memory: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      routeStatus: 'OK',
      mpStatus: process.env.MP_ACCESS_TOKEN ? 'ACTIVE' : 'INACTIVE',
      lastRun: new Date().toISOString()
    });

  } catch (error) {
    console.error('Guardian stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guardian Logs
app.get('/api/admin/guardian/logs', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const globalSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    const { data: profile } = await globalSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'dev' && profile.role !== 'owner' && profile.role !== 'admin')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Return mock logs (you can implement real logging later)
    const logs = [
      { timestamp: new Date().toISOString(), action: 'SYSTEM_CHECK', status: 'OK', details: 'All systems operational' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), action: 'DB_HEALTH', status: 'ONLINE', details: 'Database responsive' },
      { timestamp: new Date(Date.now() - 120000).toISOString(), action: 'API_STATUS', status: 'OPTIMAL', details: 'All endpoints responding' }
    ];

    res.json({ logs });

  } catch (error) {
    console.error('Guardian logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public Health Check (No Auth Required)
app.get('/api/health-check', async (req, res) => {
  try {
    const dbStart = Date.now();
    const { error: dbError } = await globalSupabase.from('profiles').select('id').limit(1);
    const dbLatency = Date.now() - dbStart;

    res.json({
      status: dbError ? 'degraded' : 'healthy',
      database: dbError ? 'disconnected' : 'connected',
      services: {
        gemini: !!GEMINI_API_KEY ? 'active' : 'inactive'
      },
      version: 'v2.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        database: !dbError,
        gemini: !!GEMINI_API_KEY,
        mercadopago: !!process.env.MP_ACCESS_TOKEN
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'offline',
      database: 'disconnected',
      services: { gemini: 'inactive' },
      error: error.message
    });
  }
});

// Guardian Run Cycle (System Activation)
app.post('/api/admin/guardian/run-cycle', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const globalSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    const { data: profile } = await globalSupabase.from('profiles').select('role').eq('id', user.id).single();
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

// EMERGENCY: Grant Dev Access (Remove after first use)
app.post('/api/admin/emergency-grant-dev', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    console.log('🚨 Emergency dev grant requested by:', user.email);

    // Use Service Role Key to bypass RLS
    const { data, error } = await globalSupabase
      .from('profiles')
      .update({ role: 'dev' })
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('❌ Failed to grant dev access:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Dev access granted to:', user.email);
    res.json({
      success: true,
      message: 'Acesso Dev concedido com sucesso!',
      profile: data[0]
    });

  } catch (error) {
    console.error('Emergency grant error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Get Profile Proxy (Bypasses Client-Side RLS issues)
app.get('/api/profile/:userId', generalLimiter, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Usando globalSupabase com Service Key para ignorar RLS
    const { data, error } = await globalSupabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      // Se não encontrar, retorna 404
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Profile not found' });
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (e) {
    console.error('Profile proxy unexpected error:', e);
    return res.status(500).json({ error: e.message });
  }
});

// 1.2 Smart Layout Analysis Route (Support for AITextOverlay)
app.post('/api/analyze-layout', generationLimiter, async (req, res) => {
  try {
    const user = await getAuthUser(req);
    // Optional: Require auth, or allow public for demo? Let's require auth.
    // if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const { imageBase64, formData } = req.body;

    if (!imageBase64) return res.status(400).json({ error: 'Image required' });

    // Use Gemini 1.5 Flash for Multimodal Analysis (Fast & Smart)
    // Note: 'gemini-1.5-flash' handles images natively.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are a WORLD-CLASS GRAPHIC DESIGNER for commercial flyers.
    Your goal is to create a STUNNING, PROFESSIONAL layout for this image.

    CLIENT PROVIDED DATA (You MUST use ALL of this):
    ${formData.titulo ? `- HEADLINE (Big & Bold): "${formData.titulo}"` : ''}
    ${formData.subtitulo ? `- SUB-HEADLINE: "${formData.subtitulo}"` : ''}
    ${formData.whatsapp ? `- WHATSAPP (Vital): "${formData.whatsapp}"` : ''}
    ${formData.facebook ? `- FACEBOOK: "${formData.facebook}"` : ''}
    ${formData.instagram ? `- INSTAGRAM: "${formData.instagram}"` : ''}
    ${formData.endereco ? `- ADDRESS (Vital): "${formData.endereco}"` : ''}
    ${formData.email ? `- EMAIL: "${formData.email}"` : ''}
    ${formData.descricao ? `- EXTRA INFO: "${formData.descricao}"` : ''}

    CRITICAL RULES:
    1. **DATA INTEGRITY**: If the client provided a phone, address, or name, it MUST appear in the layout. DO NOT SKIP ANY DATA.
    2. **VISUAL HIERARCHY**: 
       - Headline: Massive, distinct font, top or center.
       - Contact Info: Readable, grouped (usually bottom), high contrast.
    3. **PROFESSIONAL STYLES**:
       - Use 'stroke' properties for text on busy backgrounds.
       - Use 'backgroundColor' (box behind text) if legibility is hard.
       - Use 'textShadow' for depth.
    4. **COLORS**: Pick colors from the image palette but ensure WCAG AA contrast.
    5. **POSITIONING**: Do NOT cover faces or main products. Use negative space.

    RESPONSE FORMAT (Direct JSON Only):
    {
      "layout": [
        {
          "type": "string (headline|subhead|contact|info)",
          "text": "string (EXACT text from client data)",
          "x": number (0-100 % from left),
          "y": number (0-100 % from top),
          "fontSize": number (scales with image, e.g., 60 for headline, 25 for contact),
          "fontFamily": "string (Impact, Arial Black, Roboto, Brush Script MT, Courier New)",
          "color": "hex string",
          "align": "string (left|center|right)",
          "fontWeight": "string (bold|normal|900)",
          "textShadow": "string (e.g., '4px 4px 0px #000000' or '0px 0px 20px #FF00FF')",
          "strokeColor": "hex string (optional, for outline)",
          "strokeWidth": number (optional, e.g., 2-5)",
          "backgroundColor": "hex string (optional, for box behind text)",
          "padding": number (optional, padding for background box),
          "rotation": number (degrees, usually 0, maybe -5 for dynamic titles),
          "letterSpacing": number (pixels, optional),
          "maxWidth": number (pixels)
        }
      ],
      "analysis": "Brief design rationale"
    }
    `;

    // Prepare image part
    const imagePart = {
      inlineData: {
        data: imageBase64.split(',')[1] || imageBase64,
        mimeType: "image/png"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    console.log("🎨 Smart Layout Analysis Complete");

    // Clean and Parse JSON
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const layoutData = JSON.parse(jsonString);

    res.json(layoutData);

  } catch (error) {
    console.error('Layout Analysis Error:', error);
    res.status(500).json({ error: error.message });
  }
});


// --- PAYMENT SANDBOX & LOGGING ROUTES ---

// 1. GET PAYMENT LOGS (For Admin Debugging)
app.get('/api/admin/payment-logs', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    // Strict Admin Chec k
    const { data: profile } = await globalSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'owner' && profile.role !== 'dev')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data: logs, error } = await globalSupabase
        .from('payment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) throw error;
    res.json({ logs });

  } catch (error) {
    console.error('Error fetching payment logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. TEST WEBHOOK (Simulation)
app.post('/api/test-webhook', async (req, res) => {
  console.log('🧪 [TEST WEBHOOK] Recebido:', req.body);
  const { action, user_id, email, plan, status } = req.body;

  try {
     // 1. Log simulation intent
     await globalSupabase.from('payment_logs').insert({
       user_id: user_id, 
       event_type: 'SIMULATION',
       status: status,
       payload: req.body
     });

    // 2. Simulate Plan Update Logic (Mirroring Real Webhook)
    if (status === 'approved') {
       console.log(`✅ [SIMULATION] Approving ${plan} for ${email}`);
       
       // Update User Role/Plan
       const { error: profileError } = await globalSupabase
        .from('profiles')
        .update({ role: plan })
        .eq('id', user_id);

       if (profileError) throw profileError;

       // Verify usage/quota reset would happen here normally via webhook logic
       // For simulation, we just update the role.
       
       res.json({ success: true, message: `Simulação de ${plan} APROVADO executada.` });
    } else {
       res.json({ success: true, message: `Simulação de status ${status} registrada.` });
    }

  } catch (error) {
    console.error('❌ [SIMULATION ERROR]:', error);
    res.status(500).json({ error: error.message });
  }
});


// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// START
if (require.main === module) {
  // Iniciar cron job de renovação de créditos
  startCron();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });

  // --- KEEP SUPABASE ALIVE ---
  // Ping Supabase a cada 5 minutos para evitar auto-pause
  // --- KEEP SUPABASE ALIVE ---
  // (Maintained by maintainSupabaseConnection at start of file)

  // Graceful Shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    // Connection is maintained by maintainSupabaseConnection function
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Export for Vercel serverless functions
module.exports = app;
