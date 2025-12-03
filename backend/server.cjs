const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const { v4: uuidv4 } = require('uuid');
// Reintroduzindo dotenv para garantir que as variáveis sejam carregadas no ambiente Node.js
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
  console.error(`[ERRO CRÍTICO] Variáveis de ambiente secretas ausentes: ${missingEnvVars.join(', ')}`);
  console.error('O backend não pode iniciar sem estas chaves. Por favor, configure o arquivo .env.local.');
  // Se as chaves críticas estiverem faltando, o servidor deve falhar ou usar valores dummy para iniciar, mas com aviso.
}

// Variáveis de ambiente
const { 
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY, 
  SUPABASE_ANON_KEY, 
  GEMINI_API_KEY
} = process.env;

// Clientes Supabase (Usando valores dummy se as chaves estiverem faltando para evitar crash imediato, mas as funções falharão)
const dummyUrl = 'http://dummy.url';
const dummyKey = 'dummy_key';

// Agora, SUPABASE_URL deve ser carregado corretamente.
const supabaseService = createClient(SUPABASE_URL || dummyUrl, SUPABASE_SERVICE_KEY || dummyKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const supabaseAnon = createClient(SUPABASE_URL || dummyUrl, SUPABASE_ANON_KEY || dummyKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Cliente Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || dummyKey);

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
    // Usando supabaseAnon para verificar o token do usuário
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) {
      // Se houver erro de autenticação, retorna 403
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = { id: user.id, email: user.email, token }; 
    next();
  } catch (e) {
    // Se houver erro de rede (como o ENOTFOUND), retorna 500
    console.error("Erro durante a autenticação do token:", e);
    return res.status(500).json({ error: 'Erro interno ao verificar autenticação.' });
  }
};

const checkImageQuota = async (userId) => {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('Configuração do servidor incompleta: A chave SUPABASE_SERVICE_KEY está ausente.');
  }
  
  // 1. Fetch all plans (needed for QuotaCheckResponse structure)
  const { data: allPlansDetails, error: plansDetailsError } = await supabaseService
    .from('plan_details')
    .select('*');
    
  const { data: allPlansSettings, error: plansSettingsError } = await supabaseService
    .from('plan_settings')
    .select('*');
    
  if (plansDetailsError || plansSettingsError) {
      console.error("[QUOTA] Falha ao carregar detalhes/configurações de planos:", plansDetailsError || plansSettingsError);
      // Continue, mas com planos vazios
  }
  
  const plansMap = new Map(allPlansSettings?.map(s => [s.id, s]));
  const combinedPlans = allPlansDetails?.map(detail => ({
      ...detail,
      price: plansMap.get(detail.id)?.price || 0,
      max_images_per_month: plansMap.get(detail.id)?.max_images_per_month || 0,
  })) || [];


  try {
    console.log(`[QUOTA] Verificando quota para usuário ${userId}`);
    
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
          .insert({ user_id: userId, plan_id: 'free', current_usage: 0, cycle_start_date: new Date().toISOString() })
          .select()
          .single();

        if (insertError) {
          throw new Error('Falha ao inicializar plano de uso.');
        }
        usageData = newUsageData;
      } else {
        throw new Error('Falha ao verificar plano.');
      }
    }

    const { plan_id: planId, current_usage: currentUsage, cycle_start_date: cycleStartDate } = usageData;
    console.log(`[QUOTA] Usuário ${userId} plano '${planId}' com ${currentUsage} imagens usadas.`);

    const planSettings = combinedPlans.find(p => p.id === planId);

    if (!planSettings) {
      throw new Error(`Plano '${planId}' não configurado.`);
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

    const baseResponse = { 
        usage: { ...usageData, current_usage: effectiveUsage }, 
        plan: planSettings, // PlanSetting structure
        plans: combinedPlans // EditablePlan[] structure
    };

    if (effectiveUsage >= maxImages && maxImages > 0) {
      return { status: 'BLOCKED', message: `Limite de ${maxImages} imagens atingido.`, ...baseResponse };
    }
    if (usagePercentage >= 80 && maxImages > 0) {
      return { status: 'NEAR_LIMIT', message: `Você está perto do limite (${effectiveUsage}/${maxImages}).`, ...baseResponse };
    }
    return { status: 'ALLOWED', ...baseResponse };
  } catch (error) {
    console.error(`[QUOTA] ERRO CRÍTICO:`, error);
    throw new Error(error.message || 'Erro ao verificar quota.');
  }
};

// Geração de prompt detalhado
async function generateDetailedPrompt(promptInfo) {
  if (!GEMINI_API_KEY) {
    throw new Error('Configuração do servidor incompleta: A chave GEMINI_API_KEY está ausente.');
  }
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

  // Usando o modelo diretamente na chamada
  const result = await genAI.getGenerativeModel({ model: "gemini-2.5-flash" }).generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Geração de imagem com Google AI Studio (Imagen) - USANDO O SDK CORRETAMENTE
async function generateImage(detailedPrompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Configuração do servidor incompleta: A chave GEMINI_API_KEY está ausente.');
  }
  
  console.log(`[GENERATE] Iniciando geração de imagem com o prompt: ${detailedPrompt.substring(0, 100)}...`);
  
  try {
    // CORREÇÃO: Obter o modelo de imagem diretamente do SDK
    const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });
    
    const result = await imageModel.generateContent({
      contents: [{ parts: [{ text: detailedPrompt }] }],
      generationConfig: {
        responseMimeType: "image/png",
        responseModalities: ["Image"],
        aspectRatio: "3:4"
      }
    });

    if (result.response.candidates && result.response.candidates.length > 0 && result.response.candidates[0].content && result.response.candidates[0].content.parts && result.response.candidates[0].content.parts.length > 0) {
      const base64Image = result.response.candidates[0].content.parts[0].inlineData.data;
      return `data:image/png;base64,${base64Image}`;
    } else {
      throw new Error('Nenhuma imagem gerada pelo Google AI Studio.');
    }
  } catch (error) {
    console.error(`[GENERATE] ERRO DURANTE A GERAÇÃO DE IMAGEM:`, error);
    
    // O SDK do Google pode lançar um erro com mais detalhes
    if (error.message) {
        throw new Error(`Erro da API de Imagem: ${error.message}`);
    }
    
    throw new Error('Falha ao gerar imagem. Verifique os logs do servidor para mais detalhes.');
  }
}

// Upload para Supabase Storage
async function uploadImageToSupabase(imageDataUrl, userId) {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('Configuração do servidor incompleta: A chave SUPABASE_SERVICE_KEY está ausente.');
  }
  try {
    const matches = imageDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error('Formato de base64 inválido.');
    const contentType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const filePath = `${userId}/${uuidv4()}.png`; 
    
    const { data, error } = await supabaseService.storage
      .from('generated-arts')
      .upload(filePath, imageBuffer, { contentType, upsert: false });
      
    if (error) throw new Error(`Erro no upload: ${error.message}`);
    return data.path; 
  } catch (error) {
    console.error('Erro no upload da imagem:', error.message);
    throw new Error('Falha ao salvar a imagem gerada.');
  }
}

// --- API Endpoints ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend está rodando!' });
});

app.get('/api/check-quota', authenticateToken, async (req, res, next) => {
  try {
    const quotaResponse = await checkImageQuota(req.user.id);
    res.json(quotaResponse);
  } catch (error) {
    next(error);
  }
});

app.post('/api/generate', authenticateToken, generationLimiter, async (req, res, next) => {
  if (!GEMINI_API_KEY || !SUPABASE_SERVICE_KEY) {
    return next(new Error("Configuração do servidor incompleta. Verifique as chaves GEMINI_API_KEY e SUPABASE_SERVICE_KEY."));
  }
  
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
    // Verificar quota
    const quotaResponse = await checkImageQuota(user.id);
    if (quotaResponse.status === 'BLOCKED') {
        // Retorna a resposta completa de quota para o frontend
        return res.status(403).json({ error: quotaResponse.message, quotaStatus: 'BLOCKED', ...quotaResponse });
    }
    
    console.log(`[GENERATE] Gerando prompt detalhado...`);
    const detailedPrompt = await generateDetailedPrompt(sanitizedPromptInfo);
    
    console.log(`[GENERATE] Gerando imagem...`);
    const generatedImageDataUrl = await generateImage(detailedPrompt);
    
    console.log(`[GENERATE] Fazendo upload...`);
    const imagePath = await uploadImageToSupabase(generatedImageDataUrl, user.id);
    
    console.log(`[GENERATE] Salvando no DB...`);
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
    next(error);
  }
});

// --- Admin Endpoints (Placeholder for brevity, assuming they exist) ---
// ... (other admin endpoints)

// --- Mercado Pago Endpoints (Placeholder for brevity, assuming they exist) ---
// ... (other MP endpoints)


// Error Handler
app.use((err, req, res, next) => {
  console.error("[ERRO GLOBAL]", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor.';
  
  // Se o erro for uma falha de configuração crítica, use 503 (Service Unavailable)
  if (message.includes('Configuração do servidor incompleta')) {
      return res.status(503).json({ error: message });
  }
  
  if (err.quotaStatus) {
      // Se for um erro de quota, retorna 403 (Forbidden) com a estrutura completa
      return res.status(403).json({ error: message, quotaStatus: err.quotaStatus, ...err });
  }
  
  res.status(statusCode).json({ error: message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[SERVIDOR] Backend rodando em http://localhost:${PORT}`);
  console.log('[SERVIDOR] Variáveis de ambiente configuradas:', requiredEnvVars.map(v => `${v}: ${process.env[v] ? 'OK' : 'MISSING'}`).join(', '));
});