const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// --- Verificação de variáveis de ambiente ---
const requiredEnvVars = [
  'SUPABASE_URL', 
  'SUPABASE_SERVICE_KEY', 
  'SUPABASE_ANON_KEY', 
  'GEMINI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.error(`[ERRO FATAL] Variáveis de ambiente ausentes: ${missingEnvVars.join(', ')}`);
  console.error('Por favor, configure o arquivo .env.local com as variáveis necessárias.');
  process.exit(1);
}

// Variáveis de ambiente
const { 
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY, 
  SUPABASE_ANON_KEY, 
  GEMINI_API_KEY
} = process.env;

console.log('[INIT] Inicializando servidor...');
console.log('[INIT] SUPABASE_URL:', SUPABASE_URL ? 'OK' : 'MISSING');
console.log('[INIT] GEMINI_API_KEY:', GEMINI_API_KEY ? 'OK' : 'MISSING');

// Clientes Supabase
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Cliente Gemini AI
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
  message: "Muitas requisições. Tente novamente em um minuto.",
  standardHeaders: true, 
  legacyHeaders: false, 
});

// --- Funções Auxiliares ---

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token de autenticação ausente.' });

  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) {
      console.log('[AUTH] Erro na autenticação:', error?.message || 'Usuário não encontrado');
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = { id: user.id, email: user.email, token }; 
    console.log('[AUTH] Usuário autenticado:', user.id);
    next();
  } catch (e) {
    console.log('[AUTH] Erro ao verificar token:', e.message);
    return res.status(500).json({ error: 'Erro ao autenticar token.' });
  }
};

const checkImageQuota = async (userId) => {
  try {
    console.log(`[QUOTA] Verificando quota para usuário ${userId}`);
    
    // Primeiro, verificar se o usuário existe na tabela profiles
    let { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('[QUOTA] Perfil não encontrado, usando plano free padrão');
      profile = { role: 'free' };
    }

    // Agora verificar o usage
    let { data: usageData, error: usageError } = await supabaseService
      .from('user_usage')
      .select('user_id, plan_id, current_usage, cycle_start_date')
      .eq('user_id', userId)
      .single();

    if (usageError) {
      if (usageError.code === 'PGRST116') {
        console.log(`[QUOTA] Criando registro padrão 'free' para ${userId}`);
        const { data: newUsageData, error: insertError } = await supabaseService
          .from('user_usage')
          .insert({ 
            user_id: userId, 
            plan_id: profile.role || 'free', 
            current_usage: 0, 
            cycle_start_date: new Date().toISOString() 
          })
          .select()
          .single();

        if (insertError) {
          console.error('[QUOTA] Erro ao criar registro de uso:', insertError);
          throw new Error('Falha ao inicializar plano de uso.');
        }
        usageData = newUsageData;
      } else {
        console.error('[QUOTA] Erro ao verificar uso:', usageError);
        throw new Error('Falha ao verificar plano.');
      }
    }

    const { plan_id: planId, current_usage: currentUsage, cycle_start_date: cycleStartDate } = usageData;
    console.log(`[QUOTA] Usuário ${userId} plano '${planId}' com ${currentUsage} imagens usadas.`);

    // Buscar configurações do plano
    const { data: planSettings, error: planError } = await supabaseService
      .from('plan_settings')
      .select('id, price, max_images_per_month')
      .eq('id', planId)
      .single();

    if (planError || !planSettings) {
      console.log('[QUOTA] Plano não encontrado em plan_settings, usando padrão free');
      // Se não encontrar o plano, usar configuração padrão free
      const defaultPlan = {
        id: planId,
        max_images_per_month: planId === 'free' ? 3 : 10 // 3 para free, 10 para outros
      };
      
      const usagePercentage = defaultPlan.max_images_per_month > 0 ? (currentUsage / defaultPlan.max_images_per_month) * 100 : 0;
      
      if (currentUsage >= defaultPlan.max_images_per_month && defaultPlan.max_images_per_month > 0) {
        return { 
          status: 'BLOCKED', 
          usage: { ...usageData, current_usage: currentUsage }, 
          plan: defaultPlan, 
          message: `Limite de ${defaultPlan.max_images_per_month} imagens atingido.` 
        };
      }
      if (usagePercentage >= 80 && defaultPlan.max_images_per_month > 0) {
        return { 
          status: 'NEAR_LIMIT', 
          usage: { ...usageData, current_usage: currentUsage }, 
          plan: defaultPlan, 
          message: `Você está perto do limite (${currentUsage}/${defaultPlan.max_images_per_month}).` 
        };
      }
      return { 
        status: 'ALLOWED', 
        usage: { ...usageData, current_usage: currentUsage }, 
        plan: defaultPlan 
      };
    }

    const { max_images_per_month: maxImages } = planSettings;
    console.log(`[QUOTA] Plano '${planId}' permite ${maxImages} imagens/mês.`);

    const cycleStart = new Date(cycleStartDate);
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    let effectiveUsage = currentUsage;
    
    if (cycleStart < oneMonthAgo) {
      console.log(`[QUOTA] Ciclo expirado para ${userId}, resetando uso.`);
      const { error: resetError } = await supabaseService
        .from('user_usage')
        .update({ current_usage: 0, cycle_start_date: now.toISOString() })
        .eq('user_id', userId);
      if (resetError) console.error(`[QUOTA] Falha ao resetar uso para ${userId}:`, resetError);
      else effectiveUsage = 0;
    }

    const usagePercentage = maxImages > 0 ? (effectiveUsage / maxImages) * 100 : 0;
    console.log(`[QUOTA] Usuário ${userId} usou ${effectiveUsage}/${maxImages} (${usagePercentage.toFixed(1)}%).`);

    if (effectiveUsage >= maxImages && maxImages > 0) {
      return { status: 'BLOCKED', usage: { ...usageData, current_usage: effectiveUsage }, plan: planSettings, message: `Limite de ${maxImages} imagens atingido.` };
    }
    if (usagePercentage >= 80 && maxImages > 0) {
      return { status: 'NEAR_LIMIT', usage: { ...usageData, current_usage: effectiveUsage }, plan: planSettings, message: `Você está perto do limite (${effectiveUsage}/${maxImages}).` };
    }
    return { status: 'ALLOWED', usage: { ...usageData, current_usage: effectiveUsage }, plan: planSettings };
  } catch (error) {
    console.error(`[QUOTA] ERRO CRÍTICO:`, error);
    throw new Error(error.message || 'Erro ao verificar quota.');
  }
};

// Geração de prompt detalhado
async function generateDetailedPrompt(promptInfo) {
  const { companyName, phone, addressStreet, addressNumber, addressNeighborhood, addressCity, details } = promptInfo;
  
  const address = [addressStreet, addressNumber, addressNeighborhood, addressCity]
    .filter(Boolean)
    .join(', ');
    
  const servicesList = details.split('.').map(s => s.trim()).filter(s => s.length > 5).join('; ');
  
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

// Geração de imagem com Google AI Studio (Imagen)
async function generateImage(detailedPrompt) {
  try {
    console.log('[IMAGE] Iniciando geração de imagem com Google AI Studio...');
    // Usando a API REST do Imagen 3
    const IMAGEN_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${GEMINI_API_KEY}`;
    
    const response = await axios.post(
      IMAGEN_API_URL,
      {
        prompt: detailedPrompt,
        config: { 
          numberOfImages: 1, 
          outputMimeType: 'image/png', 
          aspectRatio: '3:4',
          language: "pt"
        }
      },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 60 segundos timeout
      }
    );
    
    if (response.data?.generatedImages?.length > 0) {
      const base64Image = response.data.generatedImages[0].image.imageBytes;
      console.log('[IMAGE] Imagem gerada com sucesso!');
      return `data:image/png;base64,${base64Image}`;
    } else {
      throw new Error('Nenhuma imagem gerada pelo Google AI Studio.');
    }
  } catch (error) {
    console.error('[IMAGE] Erro ao gerar imagem com Google AI Studio:', error.response ? error.response.data : error.message);
    throw new Error('Falha ao gerar imagem. Verifique a chave GEMINI_API_KEY.');
  }
}

// Upload para Supabase Storage
async function uploadImageToSupabase(imageDataUrl, userId) {
  try {
    console.log('[UPLOAD] Iniciando upload para Supabase Storage...');
    const matches = imageDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error('Formato de base64 inválido.');
    const contentType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const filePath = `${userId}/${uuidv4()}.png`; 
    
    const { data, error } = await supabaseService.storage
      .from('generated-arts')
      .upload(filePath, imageBuffer, { contentType, upsert: false });
      
    if (error) throw new Error(`Erro no upload: ${error.message}`);
    console.log('[UPLOAD] Upload concluído com sucesso!');
    return data.path; 
  } catch (error) {
    console.error('[UPLOAD] Erro no upload da imagem:', error.message);
    throw new Error('Falha ao salvar a imagem gerada.');
  }
}

// --- API Endpoints ---

// Health check
app.get('/api/health', (req, res) => {
  console.log('[HEALTH] Health check requested');
  res.json({ status: 'OK', message: 'Backend está rodando!' });
});

app.get('/api/check-quota', authenticateToken, async (req, res, next) => {
  try {
    console.log('[API] /api/check-quota - Iniciando verificação');
    const quotaResponse = await checkImageQuota(req.user.id);
    console.log('[API] /api/check-quota - Sucesso:', quotaResponse.status);
    res.json(quotaResponse);
  } catch (error) {
    console.error('[API] /api/check-quota - Erro:', error);
    next(error);
  }
});

app.post('/api/generate', authenticateToken, generationLimiter, async (req, res, next) => {
  const { promptInfo } = req.body;
  const user = req.user;

  console.log('[API] /api/generate - Iniciando geração para usuário:', user.id);

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
    // Verificar quota
    const quotaResponse = await checkImageQuota(user.id);
    if (quotaResponse.status === 'BLOCKED') {
        console.log('[API] /api/generate - Usuário bloqueado por quota');
        return res.status(403).json({ error: quotaResponse.message, quotaStatus: 'BLOCKED', ...quotaResponse });
    }
    
    console.log('[GENERATE] Gerando prompt detalhado...');
    const detailedPrompt = await generateDetailedPrompt(sanitizedPromptInfo);
    
    console.log('[GENERATE] Gerando imagem...');
    const generatedImageDataUrl = await generateImage(detailedPrompt);
    
    console.log('[GENERATE] Fazendo upload...');
    const imagePath = await uploadImageToSupabase(generatedImageDataUrl, user.id);
    
    console.log('[GENERATE] Salvando no DB...');
    const { data: image, error: dbError } = await supabaseService
      .from('images')
      .insert({ user_id: user.id, prompt: detailedPrompt, image_url: imagePath, business_info: sanitizedPromptInfo })
      .select()
      .single();

    if (dbError) throw new Error(`Erro ao salvar no DB: ${dbError.message}`);
    
    // Incrementar uso
    const { error: incrementError } = await supabaseService.rpc('increment_user_usage', { user_id_input: user.id });
    if (incrementError) console.error('Erro ao incrementar uso:', incrementError);
    
    console.log(`[GENERATE] Sucesso! Imagem ID: ${image.id}`);
    res.json({ message: 'Arte gerada com sucesso!', image });

  } catch (error) {
    console.error('[GENERATE] Erro na geração:', error);
    next(error);
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("[ERRO GLOBAL]", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor.';
  
  if (err.quotaStatus) {
      return res.status(403).json({ error: message, quotaStatus: err.quotaStatus, ...err });
  }
  
  res.status(statusCode).json({ error: message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[SERVIDOR] Backend rodando em http://localhost:${PORT}`);
  console.log('[SERVIDOR] Variáveis de ambiente configuradas:', requiredEnvVars.map(v => `${v}: ${process.env[v] ? 'OK' : 'MISSING'}`).join(', '));
});