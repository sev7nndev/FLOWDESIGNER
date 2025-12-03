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

// --- Funções Auxiliares de Autenticação e Autorização ---

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

const authorizeAdminOrDev = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    
    try {
        // 1. Usar supabaseService (Service Role Key) para ignorar RLS e obter a role real
        const { data: profile, error } = await supabaseService
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();
            
        if (error || !profile) {
            console.warn(`[AUTH] Perfil não encontrado para o usuário ${req.user.id}`);
            return res.status(403).json({ error: 'Acesso negado: Perfil não encontrado.' });
        }
        
        const role = profile.role;
        
        if (['admin', 'dev', 'owner'].includes(role)) {
            req.user.role = role; // Adiciona a role ao objeto user
            next();
        } else {
            return res.status(403).json({ error: 'Acesso negado: Permissão insuficiente.' });
        }
    } catch (e) {
        console.error("[AUTH] Erro ao verificar permissão de administrador:", e);
        return res.status(500).json({ error: 'Erro interno ao verificar permissões.' });
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
    // console.log(`[QUOTA] Verificando quota para usuário ${userId}`); // Removido para evitar log excessivo
    
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
    // console.log(`[QUOTA] Usuário ${userId} plano '${planId}' com ${currentUsage} imagens usadas.`); // Removido para evitar log excessivo

    const planSettings = combinedPlans.find(p => p.id === planId);

    if (!planSettings) {
      throw new Error(`Plano '${planId}' não configurado.`);
    }

    const { max_images_per_month: maxImages } = planSettings;
    // console.log(`[QUOTA] Plano '${planId}' permite ${maxImages} imagens/mês.`); // Removido para evitar log excessivo

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
      if (resetError) console.error('Erro ao resetar uso:', resetError);
      else effectiveUsage = 0;
    }

    const usagePercentage = maxImages > 0 ? (effectiveUsage / maxImages) * 100 : 0;
    // console.log(`[QUOTA] Usuário ${userId} usou ${effectiveUsage}/${maxImages} (${usagePercentage.toFixed(1)}%).`); // Removido para evitar log excessivo

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
    
  // 1. Sanitização e preparação da entrada do usuário
  const cleanDetails = details.replace(/[\r\n]+/g, ' ').replace(/"/g, '');
  const servicesList = cleanDetails.split('.').map(s => s.trim()).filter(s => s.length > 5).join('; ');
  
  // 2. Estrutura de Prompt com Delimitadores Fortes (Prevenção de Injeção)
  const systemInstructions = `Você é um designer profissional de social media. Sua tarefa é gerar uma arte de FLYER VERTICAL em alta qualidade, com aparência profissional. 
Use como referência o nível de qualidade de flyers modernos de pet shop, oficina mecânica, barbearia, lanchonete, salão de beleza, imobiliária e clínica.
O prompt final deve ser focado em: composição bem organizada, tipografia clara e hierarquia entre título, subtítulo e lista de serviços, ilustrações ou imagens relacionadas ao nicho, e fundo bem trabalhado, mas sem poluir o texto.
Diretrizes de design:
- Usar cores coerentes com o nicho (ex.: suaves para pet shop/saúde; escuras e fortes para mecânica/barbearia; quentes para lanchonete etc.).
- Reservar espaço para o logotipo.
- Não inventar textos aleatórios; use somente os dados fornecidos.
- O resultado deve ser APENAS o prompt de imagem final, sem introduções ou explicações.`;

  const userInputBlock = `
### DADOS DO CLIENTE ###
- Nome da empresa: ${companyName}
- Serviços principais: ${servicesList}
- Benefícios / diferenciais: ${servicesList}
- Telefone/WhatsApp: ${phone}
- Endereço (se houver): ${address}
- Nicho/Descrição do Cliente: ${cleanDetails}
### FIM DOS DADOS DO CLIENTE ###

Gere o prompt de imagem final baseado nas instruções acima e nos dados do cliente.
`;

  const prompt = systemInstructions + userInputBlock;
  
  // Usando o modelo diretamente na chamada
  const result = await genAI.getGenerativeModel({ model: "gemini-2.5-flash" }).generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Geração de imagem usando a sintaxe generateContent (compatível com o SDK atual)
async function generateImage(detailedPrompt) {
  if (!GEMINI_API_KEY) throw new Error('Chave GEMINI_API_KEY ausente.');

  // console.log(`[GENERATE] Iniciando geração de imagem com o prompt: ${detailedPrompt.substring(0, 120)}...`); // Removido para evitar log excessivo

  try {
    // Usando o modelo de geração de imagem via getGenerativeModel
    const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });

    // Chamando generateContent com a estrutura de array de objetos para imagem
    const result = await imageModel.generateContent([{
      type: "image",
      prompt: detailedPrompt,
      image_config: { size: "1024x1365" } // 3:4 vertical
    }]);

    // Extraindo o Base64 do caminho correto na resposta
    const imageBase64 = result.response?.candidates?.[0]?.content?.[0]?.image?.data;

    if (!imageBase64) {
      console.error("Estrutura de resposta da API de Imagem inesperada:", JSON.stringify(result.response, null, 2));
      throw new Error("A API não retornou a imagem corretamente. Verifique a estrutura da resposta.");
    }

    return `data:image/png;base64,${imageBase64}`;

  } catch (error) {
    console.error("[GENERATE] ERRO DURANTE A GERAÇÃO DE IMAGEM:", error);
    throw new Error(`Erro da API de Imagem: ${error?.message || "Erro desconhecido"}`);
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
    
    // console.log(`[GENERATE] Gerando prompt detalhado...`); // Removido para evitar log excessivo
    const detailedPrompt = await generateDetailedPrompt(sanitizedPromptInfo);
    
    // console.log(`[GENERATE] Gerando imagem...`); // Removido para evitar log excessivo
    const generatedImageDataUrl = await generateImage(detailedPrompt);
    
    // console.log(`[GENERATE] Fazendo upload...`); // Removido para evitar log excessivo
    const imagePath = await uploadImageToSupabase(generatedImageDataUrl, user.id);
    
    // console.log(`[GENERATE] Salvando no DB...`); // Removido para evitar log excessivo
    const { data: image, error: dbError } = await supabaseService
      .from('images')
      .insert({ user_id: user.id, prompt: detailedPrompt, image_url: imagePath, business_info: sanitizedPromptInfo })
      .select()
      .single();

    if (dbError) throw new Error(`Erro ao salvar no DB: ${dbError.message}`);
    
    // Incrementar uso
    const { error: incrementError } = await supabaseService.rpc('increment_user_usage', { user_id_input: user.id });
    if (incrementError) console.error('Erro ao incrementar uso:', incrementError);
    
    // console.log(`[GENERATE] Sucesso! Imagem ID: ${image.id}`); // Removido para evitar log excessivo
    res.json({ message: 'Arte gerada com sucesso!', image });

  } catch (error) {
    next(error);
  }
});

// --- Admin Endpoints ---

// Endpoint 1: Listar todas as imagens geradas (para DevPanelPage)
app.get('/api/admin/images', authenticateToken, authorizeAdminOrDev, async (req, res, next) => {
    try {
        // Usar supabaseService para ignorar RLS e buscar todas as imagens
        const { data, error } = await supabaseService
            .from('images')
            .select('id, user_id, prompt, image_url, business_info, created_at')
            .order('created_at', { ascending: false });
            
        if (error) throw new Error(error.message);
        
        // Nota: O frontend (useAdminGeneratedImages) é responsável por gerar as URLs assinadas.
        res.json({ images: data });
    } catch (error) {
        next(error);
    }
});

// Endpoint 2: Deletar uma imagem gerada (para DevPanelPage)
app.delete('/api/admin/images/:imageId', authenticateToken, authorizeAdminOrDev, async (req, res, next) => {
    const { imageId } = req.params;
    const { imageUrl } = req.body; // imagePath no storage
    
    if (!imageId || !imageUrl) {
        return res.status(400).json({ error: "ID da imagem e URL são obrigatórios." });
    }
    
    try {
        // 1. Deletar do Storage (usando Service Role Key)
        const { error: storageError } = await supabaseService.storage
            .from('generated-arts')
            .remove([imageUrl]);
            
        if (storageError) {
            // Se o erro for 'The resource was not found', podemos ignorar e seguir para o DB
            if (storageError.message !== 'The resource was not found') {
                console.error("Erro ao deletar do Storage:", storageError);
                throw new Error(`Falha ao deletar arquivo do storage: ${storageError.message}`);
            }
        }
        
        // 2. Deletar do Banco de Dados (usando Service Role Key)
        const { error: dbError } = await supabaseService
            .from('images')
            .delete()
            .eq('id', imageId);
            
        if (dbError) throw new Error(`Falha ao deletar do DB: ${dbError.message}`);
        
        res.status(204).send(); // No Content
        
    } catch (error) {
        next(error);
    }
});

// Endpoint 3: Upload de imagem da Landing Page (para DevPanelPage)
app.post('/api/admin/landing-images/upload', authenticateToken, authorizeAdminOrDev, async (req, res, next) => {
    const { fileBase64, fileName, userId } = req.body;
    
    if (!fileBase64 || !fileName || !userId) {
        return res.status(400).json({ error: "Dados de arquivo e ID do usuário são obrigatórios." });
    }
    
    try {
        // 1. Upload para o Storage 'landing-carousel'
        const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) throw new Error('Formato de base64 inválido.');
        const contentType = matches[1];
        const imageBuffer = Buffer.from(matches[2], 'base64');
        
        // Cria um caminho único no bucket 'landing-carousel'
        const filePath = `${uuidv4()}-${fileName}`; 
        
        const { data: uploadData, error: uploadError } = await supabaseService.storage
          .from('landing-carousel')
          .upload(filePath, imageBuffer, { contentType, upsert: false });
          
        if (uploadError) throw new Error(`Erro no upload para o carrossel: ${uploadError.message}`);
        
        // 2. Obter a ordem de classificação máxima atual
        const { data: maxOrderData, error: maxOrderError } = await supabaseService
            .from('landing_carousel_images')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1)
            .single();
            
        const nextSortOrder = (maxOrderData?.sort_order || 0) + 1;
        
        // 3. Inserir no Banco de Dados
        const { data: image, error: dbError } = await supabaseService
          .from('landing_carousel_images')
          .insert({ 
              image_url: uploadData.path, 
              created_by: userId,
              sort_order: nextSortOrder
          })
          .select('id, image_url, sort_order')
          .single();

        if (dbError) throw new Error(`Erro ao salvar no DB: ${dbError.message}`);
        
        // 4. Gerar URL pública para retorno ao frontend
        const { data: { publicUrl } } = supabaseAnon.storage
            .from('landing-carousel')
            .getPublicUrl(image.image_url);
            
        res.json({ 
            message: 'Upload de imagem da landing page realizado com sucesso!', 
            image: {
                id: image.id,
                url: publicUrl,
                sortOrder: image.sort_order
            }
        });
        
    } catch (error) {
        next(error);
    }
});

// Endpoint 4: Deletar imagem da Landing Page (para DevPanelPage)
app.delete('/api/admin/landing-images/:imageId', authenticateToken, authorizeAdminOrDev, async (req, res, next) => {
    const { imageId } = req.params;
    const { imagePath } = req.body; // imagePath no storage
    
    if (!imageId || !imagePath) {
        return res.status(400).json({ error: "ID da imagem e caminho do storage são obrigatórios." });
    }
    
    try {
        // 1. Deletar do Storage (usando Service Role Key)
        const { error: storageError } = await supabaseService.storage
            .from('landing-carousel')
            .remove([imagePath]);
            
        if (storageError && storageError.message !== 'The resource was not found') {
            console.error("Erro ao deletar do Storage:", storageError);
            throw new Error(`Falha ao deletar arquivo do storage: ${storageError.message}`);
        }
        
        // 2. Deletar do Banco de Dados (usando Service Role Key)
        const { error: dbError } = await supabaseService
            .from('landing_carousel_images')
            .delete()
            .eq('id', imageId);
            
        if (dbError) throw new Error(`Falha ao deletar do DB: ${dbError.message}`);
        
        res.status(204).send(); // No Content
        
    } catch (error) {
        next(error);
    }
});


// --- Mercado Pago Endpoints (Placeholder for brevity, assuming they exist) ---
app.post('/api/subscribe', authenticateToken, async (req, res, next) => {
    // Placeholder for subscription initiation
    res.status(501).json({ error: "Endpoint de assinatura não implementado." });
});

app.get('/api/admin/mp-connect', authenticateToken, authorizeAdminOrDev, async (req, res, next) => {
    // CRITICAL FIX 1: Ensure only 'owner' can access payment account details
    if (req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Acesso negado: Apenas o Owner pode gerenciar a conexão MP.' });
    }
    
    // Placeholder for MP OAuth Connect URL
    res.status(501).json({ error: "Endpoint de conexão MP não implementado." });
});


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
  const requiredEnvVars = [
    'SUPABASE_URL', 
    'SUPABASE_SERVICE_KEY', 
    'SUPABASE_ANON_KEY', 
    'GEMINI_API_KEY'
  ];
  console.log('[SERVIDOR] Variáveis de ambiente configuradas:', requiredEnvVars.map(v => `${v}: ${process.env[v] ? 'OK' : 'MISSING'}`).join(', '));
  
  // NOVO: Log da versão do SDK para diagnóstico
  const sdkVersion = require('@google/generative-ai/package.json').version;
  console.log(`[DIAGNÓSTICO] Versão do SDK @google/generative-ai: ${sdkVersion}`);
});