const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const { v4: uuidv4 } = require('uuid');
const mercadopago = require('mercadopago'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Robust Environment Variable Check ---
const requiredEnvVars = [
  'SUPABASE_URL', 
  'SUPABASE_SERVICE_KEY', 
  'SUPABASE_ANON_KEY', 
  'GEMINI_API_KEY'
];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.error(`[FATAL ERROR] Missing required environment variables: ${missingEnvVars.join(', ')}. Please check your .env.local file.`);
  process.exit(1);
}

// Warn if Mercado Pago keys are missing, but allow server to start
const mpEnvVars = ['MP_CLIENT_ID', 'MP_CLIENT_SECRET', 'MP_REDIRECT_URI', 'MP_OWNER_ID'];
const missingMpVars = mpEnvVars.filter(v => !process.env[v]);
if (missingMpVars.length > 0) {
    console.warn(`[WARNING] Mercado Pago environment variables are missing: ${missingMpVars.join(', ')}. Payment functionality will be disabled.`);
}

// Environment Variables
const { 
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY, 
  SUPABASE_ANON_KEY, 
  GEMINI_API_KEY,
  MP_CLIENT_ID,
  MP_CLIENT_SECRET,
  MP_REDIRECT_URI,
  MP_OWNER_ID
} = process.env;

// Supabase Clients
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Gemini AI Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://ai.studio'], 
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' })); 
app.set('trust proxy', 1);

// Rate Limiting
const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Muitas requisições de geração. Por favor, tente novamente após um minuto.",
  standardHeaders: true, 
  legacyHeaders: false, 
  keyGenerator: (req) => req.user.id, 
});

// --- Helper Functions ---

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token de autenticação ausente.' });

  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) {
      console.error("[AUTH] JWT verification failed:", error?.message || "User not found");
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = { id: user.id, email: user.email, token }; 
    next();
  } catch (e) {
    console.error("[AUTH] Critical error during token authentication:", e.message);
    return res.status(500).json({ error: 'Erro interno do servidor ao autenticar token.' });
  }
};

const checkAdminOrDev = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || !['admin', 'dev', 'owner'].includes(profile.role)) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores e desenvolvedores podem realizar esta ação.' });
    }
    next();
  } catch (e) {
    console.error("[AUTH] Error checking admin/dev role:", e.message);
    return res.status(500).json({ error: 'Erro interno do servidor ao verificar permissões.' });
  }
};

const checkImageQuota = async (userId) => {
  try {
    console.log(`[QUOTA] Checking quota for user ${userId}`);
    
    let { data: usageData, error: usageError } = await supabaseService
      .from('user_usage')
      .select('user_id, plan_id, current_usage, cycle_start_date')
      .eq('user_id', userId)
      .single();

    if (usageError) {
      if (usageError.code === 'PGRST116') {
        console.log(`[QUOTA] No usage record for ${userId}, creating default 'free' record.`);
        const { data: newUsageData, error: insertError } = await supabaseService
          .from('user_usage')
          .insert({ user_id: userId, plan_id: 'free', current_usage: 0, cycle_start_date: new Date().toISOString() })
          .select()
          .single();

        if (insertError) {
          console.error(`[QUOTA] Failed to create default usage record for ${userId}:`, insertError);
          throw new Error('Falha ao inicializar plano de uso. Contate o suporte.');
        }
        usageData = newUsageData;
      } else {
        console.error(`[QUOTA] Unexpected DB error fetching usage for ${userId}:`, usageError);
        throw new Error('Falha ao verificar plano. Tente novamente.');
      }
    }

    const { plan_id: planId, current_usage: currentUsage, cycle_start_date: cycleStartDate } = usageData;
    console.log(`[QUOTA] User ${userId} has plan '${planId}' with ${currentUsage} images used.`);

    const { data: planSettings, error: planError } = await supabaseService
      .from('plan_settings')
      .select('id, price, max_images_per_month')
      .eq('id', planId)
      .single();

    if (planError || !planSettings) {
      console.error(`[QUOTA] Plan settings not found for plan ID '${planId}':`, planError?.message || 'Plan settings missing in DB.');
      throw new Error(`Plano '${planId}' não configurado corretamente. Contate o suporte.`);
    }

    const { max_images_per_month: maxImages } = planSettings;
    console.log(`[QUOTA] Plan '${planId}' allows ${maxImages} images/month.`);

    const cycleStart = new Date(cycleStartDate);
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    let effectiveUsage = currentUsage;
    
    if (cycleStart < oneMonthAgo) {
      console.log(`[QUOTA] Cycle expired for ${userId}, resetting usage.`);
      const { error: resetError } = await supabaseService
        .from('user_usage')
        .update({ current_usage: 0, cycle_start_date: now.toISOString() })
        .eq('user_id', userId);
      if (resetError) console.error(`[QUOTA] Failed to reset usage for ${userId}:`, resetError);
      else effectiveUsage = 0;
    }

    const usagePercentage = maxImages > 0 ? (effectiveUsage / maxImages) * 100 : 0;
    console.log(`[QUOTA] User ${userId} has used ${effectiveUsage}/${maxImages} images (${usagePercentage.toFixed(1)}%).`);

    if (effectiveUsage >= maxImages && maxImages > 0) {
      return { status: 'BLOCKED', usage: { ...usageData, current_usage: effectiveUsage }, plan: planSettings, message: `Limite de ${maxImages} imagens atingido para o plano ${planId}.` };
    }
    if (usagePercentage >= 80 && maxImages > 0) {
      return { status: 'NEAR_LIMIT', usage: { ...usageData, current_usage: effectiveUsage }, plan: planSettings, message: `Você está perto do limite (${effectiveUsage}/${maxImages}).` };
    }
    return { status: 'ALLOWED', usage: { ...usageData, current_usage: effectiveUsage }, plan: planSettings };
  } catch (error) {
    console.error(`[QUOTA] CRITICAL ERROR checking quota for user ${userId}:`, error);
    // Propagate the specific error message to the frontend
    throw new Error(error.message || 'Erro interno ao verificar quota. Tente novamente.');
  }
};

const incrementUsage = async (userId) => {
  try {
    const { error } = await supabaseService.rpc('increment_user_usage', { user_id_input: userId });
    if (error) {
      console.error(`[USAGE] Failed to call RPC increment_user_usage for ${userId}:`, error);
      throw new Error('Falha ao registrar o uso da imagem via RPC.');
    }
    console.log(`[USAGE] Successfully incremented usage for user ${userId}`);
  } catch (error) {
    console.error(`[USAGE] Error incrementing usage for ${userId}:`, error);
    throw error; // Re-throw to be caught by the main endpoint handler
  }
};

// ... (O resto das funções como generateDetailedPrompt, generateImage, uploadImageToSupabase permanecem as mesmas)
// AI Prompt Generation (Refactored to match user's request)
async function generateDetailedPrompt(promptInfo) {
  const { companyName, phone, addressStreet, addressNumber, addressNeighborhood, addressCity, details } = promptInfo;
  
  // Format address and services list for the AI
  const address = [addressStreet, addressNumber, addressNeighborhood, addressCity]
    .filter(Boolean)
    .join(', ');
    
  const servicesList = details.split('.').map(s => s.trim()).filter(s => s.length > 5).join('; ');
  
  // Prompt base conforme solicitado pelo usuário
  const prompt = `Você é um designer profissional de social media. Gere uma arte de FLYER VERTICAL em alta qualidade, com aparência profissional.  
Use como referência o nível de qualidade de flyers modernos de pet shop, oficina mecânica, barbearia, lanchonete, salão de beleza, imobiliária e clínica, com:  
- composição bem organizada;  
- tipografia clara e hierarquia entre título, subtítulo e lista de serviços;  
- ilustrações ou imagens relacionadas ao nicho;  
- fundo bem trabalhado, mas sem poluir o texto.  
Nicho do cliente: ${details}.  
Dados que DEVEM aparecer no flyer:  
- Nome da empresa: ${companyName}  
- Serviços principais: ${servicesList}  
- Benefícios / diferenciais: ${servicesList}  
- Telefone/WhatsApp: ${phone}  
- Endereço (se houver): ${address}  
Diretrizes de design:  
- Usar cores coerentes com o nicho (ex.: suaves para pet shop/saúde; escuras e fortes para mecânica/barbearia; quentes para lanchonete etc.).  
- Reservar espaço para o logotipo.  
- Não inventar textos aleatórios; use somente os dados fornecidos.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Google AI Studio Image Generation (Using Imagen/Nano Banana via REST API)
async function generateImage(detailedPrompt) {
  const IMAGEN_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${GEMINI_API_KEY}`;
  try {
    const response = await axios.post(
      IMAGEN_API_URL,
      {
        prompt: detailedPrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '3:4' }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (response.data?.generatedImages?.length > 0) {
      const base64Image = response.data.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64Image}`;
    } else {
      throw new Error('Nenhuma imagem gerada pelo Google AI Studio.');
    }
  } catch (error) {
    console.error('Erro ao gerar imagem com Google AI Studio:', error.response ? error.response.data : error.message);
    throw new Error('Falha ao gerar imagem. Verifique a chave GEMINI_API_KEY e as permissões de imagem.');
  }
}

// Supabase Storage Upload
async function uploadImageToSupabase(imageDataUrl, userId) {
  try {
    const matches = imageDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error('Formato de base64 inválido.');
    const contentType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const filePath = `${userId}/${uuidv4()}.png`; 
    const { data, error } = await supabaseService.storage
      .from('generated-arts')
      .upload(filePath, imageBuffer, { contentType, upsert: false });
    if (error) throw new Error(`Erro no upload para Supabase: ${error.message}`);
    return data.path; 
  } catch (error) {
    console.error('Erro no upload da imagem para o Supabase:', error.message);
    throw new Error('Falha ao salvar a imagem gerada.');
  }
}


// --- API Endpoints ---

app.get('/api/check-quota', authenticateToken, async (req, res, next) => {
    try {
        const quotaResponse = await checkImageQuota(req.user.id);
        res.json(quotaResponse);
    } catch (error) {
        // The error from checkImageQuota is now more specific
        next(error);
    }
});

app.post('/api/generate', authenticateToken, generationLimiter, async (req, res, next) => {
  const { promptInfo } = req.body;
  const user = req.user;

  if (!promptInfo) return res.status(400).json({ error: "Objeto 'promptInfo' ausente." });

  const sanitizedPromptInfo = {
    companyName: sanitizeHtml(promptInfo.companyName || '', { allowedTags: [], allowedAttributes: {} }),
    phone: sanitizeHtml(promptInfo.phone || '', { allowedTags: [], allowedAttributes: {} }),
    addressStreet: sanitizeHtml(promptInfo.addressStreet || '', { allowedTags: [], allowedAttributes: {} }),
    addressNumber: sanitizeHtml(promptInfo.addressNumber || '', { allowedTags: [], allowedAttributes: {} }),
    addressNeighborhood: sanitizeHtml(promptInfo.addressNeighborhood || '', { allowedTags: [], allowedAttributes: {} }),
    addressCity: sanitizeHtml(promptInfo.addressCity || '', { allowedTags: [], allowedAttributes: {} }),
    details: sanitizeHtml(promptInfo.details || '', { allowedTags: [], allowedAttributes: {} }),
    logo: promptInfo.logo 
  };

  if (!sanitizedPromptInfo.companyName || !sanitizedPromptInfo.details) {
    return res.status(400).json({ error: "Nome da empresa e detalhes são obrigatórios." });
  }
  
  if (sanitizedPromptInfo.logo && sanitizedPromptInfo.logo.length > 40000) {
    return res.status(400).json({ error: `O logo é muito grande.` });
  }

  try {
    const quotaResponse = await checkImageQuota(user.id);
    if (quotaResponse.status === 'BLOCKED') {
        return res.status(403).json({ error: quotaResponse.message, quotaStatus: 'BLOCKED', ...quotaResponse });
    }
    
    console.log(`[GENERATE] User ${user.id}: Generating detailed prompt...`);
    const detailedPrompt = await generateDetailedPrompt(sanitizedPromptInfo);
    
    console.log(`[GENERATE] User ${user.id}: Generating image...`);
    const generatedImageDataUrl = await generateImage(detailedPrompt);
    
    console.log(`[GENERATE] User ${user.id}: Uploading image...`);
    const imagePath = await uploadImageToSupabase(generatedImageDataUrl, user.id);
    
    console.log(`[GENERATE] User ${user.id}: Saving to DB and incrementing usage...`);
    const { data: image, error: dbError } = await supabaseService
      .from('images')
      .insert({ user_id: user.id, prompt: detailedPrompt, image_url: imagePath, business_info: sanitizedPromptInfo })
      .select()
      .single();

    if (dbError) throw new Error(`Erro ao salvar no DB: ${dbError.message}`);
    
    await incrementUsage(user.id);
    
    console.log(`[GENERATE] User ${user.id}: Success! Image ID: ${image.id}`);
    res.json({ message: 'Arte gerada com sucesso!', image });

  } catch (error) {
    next(error);
  }
});

// ... (O resto dos endpoints admin e de pagamento permanecem os mesmos)
// Admin endpoint to get all generated images
app.get('/api/admin/images', authenticateToken, checkAdminOrDev, async (req, res, next) => {
  try {
    const { data, error } = await supabaseService.from('images').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ images: data });
  } catch (error) { next(error); }
});

// Admin endpoint to delete a generated image
app.delete('/api/admin/images/:id', authenticateToken, checkAdminOrDev, async (req, res, next) => {
  const { id } = req.params;
  const { imageUrl } = req.body; 
  if (!imageUrl) return res.status(400).json({ error: "Caminho da imagem é obrigatório." });
  try {
    const { error: storageError } = await supabaseService.storage.from('generated-arts').remove([imageUrl]);
    if (storageError) console.warn(`Warning: Failed to delete from storage (${imageUrl}): ${storageError.message}`);
    const { error: dbError } = await supabaseService.from('images').delete().eq('id', id);
    if (dbError) throw new Error(dbError.message);
    res.json({ message: 'Imagem deletada com sucesso.' });
  } catch (error) { next(error); }
});

// Admin endpoint to upload a landing carousel image
app.post('/api/admin/landing-images/upload', authenticateToken, checkAdminOrDev, async (req, res, next) => {
  const { fileBase64, fileName, userId } = req.body;
  if (!fileBase64 || !fileName || !userId) return res.status(400).json({ error: "Dados incompletos." });
  if (req.user.id !== userId) return res.status(403).json({ error: "Não autorizado." });
  try {
    const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) throw new Error('Formato de base64 inválido.');
    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: `Arquivo muito grande (Max 5MB).` });
    const filePath = `landing-carousel/${userId}/${uuidv4()}.${fileName.split('.').pop()}`; 
    const { error: uploadError } = await supabaseService.storage.from('landing-carousel').upload(filePath, buffer, { contentType: matches[1] });
    if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
    const { data: dbData, error: dbError } = await supabaseService.from('landing_carousel_images').insert({ image_url: filePath, created_by: userId }).select('id, image_url, sort_order').single();
    if (dbError) {
      await supabaseService.storage.from('landing-carousel').remove([filePath]);
      throw new Error(`Falha ao registrar no DB: ${dbError.message}`);
    }
    const { data: { publicUrl } } = supabaseService.storage.from('landing-carousel').getPublicUrl(dbData.image_url);
    res.status(200).json({ message: 'Upload com sucesso!', image: { id: dbData.id, url: publicUrl, sortOrder: dbData.sort_order } });
  } catch (error) { next(error); }
});

// Admin endpoint to delete a landing carousel image
app.delete('/api/admin/landing-images/:id', authenticateToken, checkAdminOrDev, async (req, res, next) => {
  const { id } = req.params;
  const { imagePath } = req.body; 
  if (!imagePath) return res.status(400).json({ error: "Caminho da imagem é obrigatório." });
  try {
    const { error: storageError } = await supabaseService.storage.from('landing-carousel').remove([imagePath]);
    if (storageError) console.warn(`Warning: Failed to delete from storage (${imagePath}): ${storageError.message}`);
    const { error: dbError } = await supabaseService.from('landing_carousel_images').delete().eq('id', id);
    if (dbError) throw new Error(dbError.message);
    res.json({ message: 'Imagem deletada com sucesso.' });
  } catch (error) { next(error); }
});

// Admin endpoint to update plan settings
app.put('/api/admin/plan-settings/update', authenticateToken, checkAdminOrDev, async (req, res, next) => {
    const { plans } = req.body;
    if (!Array.isArray(plans)) return res.status(400).json({ error: "Lista de planos inválida." });
    try {
        const settingsUpdates = plans.map(p => ({ id: p.id, price: p.price, max_images_per_month: p.max_images_per_month, updated_by: req.user.id, updated_at: new Date() }));
        const { error: sErr } = await supabaseService.from('plan_settings').upsert(settingsUpdates, { onConflict: 'id' });
        if (sErr) throw new Error(sErr.message);
        const detailsUpdates = plans.map(p => ({ id: p.id, display_name: p.display_name, description: p.description, features: p.features, updated_at: new Date() }));
        const { error: dErr } = await supabaseService.from('plan_details').upsert(detailsUpdates, { onConflict: 'id' });
        if (dErr) throw new Error(dErr.message);
        res.json({ message: 'Planos atualizados com sucesso.' });
    } catch (error) { next(error); }
});

// Mercado Pago Endpoints
app.get('/api/admin/mp-connect', authenticateToken, checkAdminOrDev, (req, res) => {
    const authUrl = `https://auth.mercadopago.com/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${MP_REDIRECT_URI}`;
    res.redirect(authUrl);
});

app.get('/api/admin/mp-callback', authenticateToken, checkAdminOrDev, async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('Código de autorização ausente.');
    try {
        const tokenResponse = await axios.post('https://api.mercadopago.com/oauth/token', { client_id: MP_CLIENT_ID, client_secret: MP_CLIENT_SECRET, code, redirect_uri: MP_REDIRECT_URI, grant_type: 'authorization_code' });
        const { access_token, refresh_token, expires_in, token_type, scope } = tokenResponse.data;
        const { error } = await supabaseService.from('owners_payment_accounts').upsert({ owner_id: MP_OWNER_ID, access_token, refresh_token, expires_in, token_type, scope, updated_at: new Date() }, { onConflict: 'owner_id' });
        if (error) throw new Error('Falha ao salvar tokens do MP.');
        res.redirect(`http://localhost:3000/app/dev-panel?mp_status=success`);
    } catch (error) {
        console.error("MP OAuth Error:", error.response ? error.response.data : error.message);
        res.redirect(`http://localhost:3000/app/dev-panel?mp_status=error&message=Falha na conexão com MP.`);
    }
});

app.post('/api/subscribe', authenticateToken, async (req, res, next) => {
    const { planId } = req.body;
    if (!['starter', 'pro'].includes(planId)) return res.status(400).json({ error: "Plano inválido." });
    try {
        const { data: ownerAccount, error: mpError } = await supabaseService.from('owners_payment_accounts').select('access_token').eq('owner_id', MP_OWNER_ID).single();
        if (mpError || !ownerAccount) throw new Error('Configuração de pagamento do SaaS ausente.');
        mercadopago.configure({ access_token: ownerAccount.access_token });
        const { data: planSettings, error: planError } = await supabaseService.from('plan_settings').select('price').eq('id', planId).single();
        if (planError || !planSettings) throw new Error('Preço do plano não encontrado.');
        const preference = {
            items: [{ title: `Assinatura Flow Designer - Plano ${planId.toUpperCase()}`, quantity: 1, currency_id: 'BRL', unit_price: parseFloat(planSettings.price) }],
            payer: { email: req.user.email },
            back_urls: { success: `${MP_REDIRECT_URI}?payment_status=success`, failure: `${MP_REDIRECT_URI}?payment_status=failure`, pending: `${MP_REDIRECT_URI}?payment_status=pending` },
            auto_return: 'approved',
            external_reference: req.user.id,
        };
        const mpResponse = await mercadopago.preferences.create(preference);
        res.json({ paymentUrl: mpResponse.body.init_point });
    } catch (error) { next(error); }
});

app.get('/api/mp-webhook', (req, res) => res.status(200).send('OK'));
app.post('/api/mp-webhook', async (req, res) => {
    const { type, data } = req.body;
    if (type === 'payment' && data?.id) {
        console.log(`[WEBHOOK] Received payment notification for ID: ${data.id}`);
        try {
            const { data: ownerAccount } = await supabaseService.from('owners_payment_accounts').select('access_token').eq('owner_id', MP_OWNER_ID).single();
            if (!ownerAccount) throw new Error("Owner MP config missing.");
            const { data: payment } = await axios.get(`https://api.mercadopago.com/v1/payments/${data.id}`, { headers: { 'Authorization': `Bearer ${ownerAccount.access_token}` } });
            const { status, external_reference: userId } = payment;
            const planId = (payment.items[0]?.title || '').includes('Pro') ? 'pro' : 'starter';
            console.log(`[WEBHOOK] Payment Status: ${status}, User: ${userId}, Plan: ${planId}`);
            if (status === 'approved' && userId && planId) {
                const { error: pErr } = await supabaseService.from('profiles').update({ role: planId }).eq('id', userId);
                if (pErr) console.error(`[WEBHOOK] Failed to update profile for ${userId}:`, pErr);
                const { error: uErr } = await supabaseService.from('user_usage').update({ plan_id: planId, current_usage: 0, cycle_start_date: new Date() }).eq('user_id', userId);
                if (uErr) console.error(`[WEBHOOK] Failed to update usage for ${userId}:`, uErr);
                console.log(`[WEBHOOK] SUCCESS: User ${userId} upgraded to ${planId}.`);
            }
            res.status(200).send('OK');
        } catch (error) {
            console.error("[WEBHOOK] Error processing notification:", error.message);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(200).send('Notification type ignored');
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR HANDLER]", err);
  const statusCode = err.statusCode || 500;
  // Provide a more user-friendly message but keep the original for logging
  const message = err.message || 'Ocorreu um erro inesperado no servidor.';
  
  if (err.quotaStatus) {
      return res.status(403).json({ error: message, quotaStatus: err.quotaStatus, ...err });
  }
  
  res.status(statusCode).json({ error: message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[SERVER] Backend server running on http://localhost:${PORT}`);
});