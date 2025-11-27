const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// FIX: Load .env files from the project root directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 3001;

// API & Supabase Keys
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreW5iaWl4eGNmdHhndmpwanh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjQ3MTcsImV4cCI6MjA3OTc0MDcxN30.FoIp7_p8gI_-JTuL4UU75mfyw1kjUxj0fDvtx6ZwVAI";

// NEW: Log environment variables for debugging
console.log("Backend Environment Variables Check:");
console.log(`SUPABASE_URL: ${SUPABASE_URL ? 'Configured' : 'MISSING/EMPTY'}`);
console.log(`SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY ? 'Configured' : 'MISSING/EMPTY'}`);
console.log(`PERPLEXITY_API_KEY: ${PERPLEXITY_API_KEY ? 'Configured' : 'MISSING/EMPTY'}`);
console.log(`FREEPIK_API_KEY: ${FREEPIK_API_KEY ? 'Configured' : 'MISSING/EMPTY'}`);
console.log(`SUPABASE_ANON_KEY (VITE_SUPABASE_ANON_KEY): ${SUPABASE_ANON_KEY ? 'Configured' : 'MISSING/EMPTY'}`);
console.log(`PORT: ${port}`);


// FIX: Check for essential variables and provide a clear startup error if missing or empty
if (!SUPABASE_URL || SUPABASE_URL === '' ||
    !SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === '' ||
    !PERPLEXITY_API_KEY || PERPLEXITY_API_KEY === '' ||
    !FREEPIK_API_KEY || FREEPIK_API_KEY === '') {
  console.error("\n\n\x1b[31m%s\x1b[0m", "ERRO FATAL: Variáveis de ambiente essenciais (SUPABASE_URL, SUPABASE_SERVICE_KEY, PERPLEXITY_API_KEY, FREEPIK_API_KEY) não foram encontradas ou estão vazias.");
  console.error("Por favor, verifique o arquivo .env.local na raiz do projeto e preencha TODAS as chaves com valores válidos.\n\n");
  process.exit(1);
}

// Service Role Client (High Privilege)
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Anon Client (Low Privilege - for JWT verification)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Middleware
app.use(cors()); 
app.use(express.json({ limit: '50kb' }));
app.set('trust proxy', 1); 

const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user.id, 
  message: { error: "Muitas requisições de geração. Tente novamente em um minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: 'Token de autenticação ausente.' });
  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) {
      console.error("Supabase Auth Error:", error);
      return res.status(403).json({ error: `Token inválido ou expirado: ${error?.message || 'Erro desconhecido.'}` });
    }
    req.user = { ...user, token }; 
    next();
  } catch (e) {
    console.error("Authentication Token Error:", e);
    return res.status(403).json({ error: `Falha na autenticação do token: ${e.message || 'Erro desconhecido.'}` });
  }
};

const checkAdminOrDev = async (req, res, next) => {
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${req.user.token}` } }
    });
    const { data: profile, error } = await supabaseAuth.from('profiles').select('role').eq('id', req.user.id).single();
    if (error || !profile || !['admin', 'dev'].includes(profile.role)) {
      console.warn(`User ${req.user.id} (role: ${profile?.role}) attempted admin/dev access.`);
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para esta ação.' });
    }
    req.user.role = profile.role;
    next();
};

// --- Helper Functions for AI Generation ---

const generateDetailedPrompt = async (briefing) => {
  if (!PERPLEXITY_API_KEY || PERPLEXITY_API_KEY === '') {
    console.error("PERPLEXITY_API_KEY is missing or empty. Check .env.local.");
    throw new Error("Erro de configuração: PERPLEXITY_API_KEY não está definida ou está vazia no backend. Verifique seu arquivo .env.local.");
  }
  const systemPrompt = `
    Você é um especialista em engenharia de prompts para IAs de geração de imagem. Sua tarefa é pegar um briefing simples de um cliente e transformá-lo em um prompt detalhado e técnico em inglês. O prompt deve ser rico em detalhes sobre iluminação, estilo de arte, composição, cores e emoção, para gerar um flyer de marketing visualmente impressionante.

    Regras:
    - O prompt final deve ser em INGLÊS.
    - Não inclua texto visível na imagem, a menos que seja o nome da empresa.
    - Foque em elementos visuais: iluminação cinematográfica, texturas realistas, cores vibrantes, etc.
    - Adapte o estilo ao tipo de negócio (ex: moderno para tecnologia, rústico para comida, etc.).
    - O output deve ser APENAS o prompt, sem nenhuma outra explicação.
  `;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'llama-3-sonar-large-32k-online',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Crie um prompt para o seguinte negócio: ${briefing}` }
      ],
    }, {
      headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}` }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Perplexity API Error:", error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    throw new Error(`Falha ao gerar o prompt detalhado com a IA (Perplexity): ${errorMessage}. Verifique sua PERPLEXITY_API_KEY e limites de uso.`);
  }
};

const generateImage = async (prompt) => {
  if (!FREEPIK_API_KEY || FREEPIK_API_KEY === '') {
    console.error("FREEPIK_API_KEY is missing or empty. Check .env.local.");
    throw new Error("Erro de configuração: FREEPIK_API_KEY não está definida ou está vazia no backend. Verifique seu arquivo .env.local.");
  }
  try {
    // 1. Start generation
    const startResponse = await axios.post('https://api.freepik.com/v1/images/generate', {
      prompt: prompt,
      size: "1024x1792"
    }, {
      headers: { 'X-Freepik-API-Key': FREEPIK_API_KEY, 'Content-Type': 'application/json' }
    });
    
    const generationId = startResponse.data.data.id;

    // 2. Poll for result
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts * 3 seconds = 60 seconds timeout
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      const statusResponse = await axios.get(`https://api.freepik.com/v1/images/generate/status/${generationId}`, {
        headers: { 'X-Freepik-API-Key': FREEPIK_API_KEY }
      });

      if (statusResponse.data.data.status === 'complete') {
        return statusResponse.data.data.images[0].url;
      }
      attempts++;
    }
    throw new Error("Tempo de geração da imagem excedido (mais de 60 segundos).");
  } catch (error) {
    console.error("Freepik API Error:", error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(`Falha ao gerar a imagem com a IA (Freepik): ${errorMessage}. Verifique sua FREEPIK_API_KEY e limites de uso.`);
  }
};

const uploadImageToSupabase = async (imageUrl, userId) => {
  try {
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');
    const filePath = `${userId}/${uuidv4()}.png`;

    const { data, error } = await supabaseService.storage
      .from('generated-arts')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) throw error;
    return data.path;
  } catch (error) {
    console.error("Supabase Upload Error for user", userId, ":", error);
    const errorMessage = error.message || 'Erro desconhecido no Supabase Storage.';
    throw new Error(`Falha ao salvar a imagem gerada no Supabase Storage: ${errorMessage}. Verifique as permissões do bucket 'generated-arts'.`);
  }
};


// --- API Routes ---

app.post('/api/generate', authenticateToken, generationLimiter, async (req, res, next) => { // Added 'next'
  const { promptInfo } = req.body;
  const user = req.user;

  if (!promptInfo) {
    return res.status(400).json({ error: "Corpo da requisição inválido: objeto 'promptInfo' ausente." });
  }

  const MAX_DETAILS_LENGTH = 1000;
  const MAX_COMPANY_NAME_LENGTH = 100;
  const MAX_ADDRESS_LENGTH = 100;
  const MAX_PHONE_LENGTH = 30;
  const MAX_LOGO_LENGTH = 40000; 
  const REGEX_ALPHANUMERIC_SPACES = /^[a-zA-Z0-9\s\u00C0-\u00FF.,\-&]*$/;
  const REGEX_PHONE = /^[0-9\s\-\(\)\+]*$/;
  const REGEX_ADDRESS_NUMBER = /^[a-zA-Z0-9\s\-\/]*$/;
  const REGEX_BASE64_BODY = /^[A-Za-z0-9+/=]*$/; 
  const sanitizeAndValidateString = (value, maxLength, fieldName, regex = REGEX_ALPHANUMERIC_SPACES) => {
    if (typeof value !== 'string') return `O campo ${fieldName} deve ser uma string.`;
    if (value.length > maxLength) return `O campo ${fieldName} não pode exceder ${maxLength} caracteres.`;
    const sanitizedValue = sanitizeHtml(value.trim(), { allowedTags: [], allowedAttributes: {} });
    if (!regex.test(sanitizedValue)) return `O campo ${fieldName} contém caracteres inválidos.`;
    return sanitizedValue;
  };
  const validateAddressNumber = (value) => sanitizeAndValidateString(value, MAX_ADDRESS_LENGTH, 'addressNumber', REGEX_ADDRESS_NUMBER);
  const validatePhone = (value) => sanitizeAndValidateString(value, MAX_PHONE_LENGTH, 'phone', REGEX_PHONE);
  const validateLogo = (value) => {
      if (!value) return null;
      if (!value.startsWith('data:image/')) return "O logo não está no formato Base64 esperado.";
      const parts = value.split(',');
      if (parts.length !== 2) return "Formato Base64 inválido.";
      const base64Body = parts[1];
      if (base64Body.length > MAX_LOGO_LENGTH) return `O logo não pode exceder ${MAX_LOGO_LENGTH} caracteres (aprox. 30KB).`;
      if (!REGEX_BASE64_BODY.test(base64Body)) return "O logo contém caracteres Base64 inválidos.";
      return value;
  };
  if (!promptInfo.details || !promptInfo.companyName) return res.status(400).json({ error: "Briefing e nome da empresa são obrigatórios." });
  const sanitizedPromptInfo = {};
  const fieldsToValidate = [
    { key: 'companyName', max: MAX_COMPANY_NAME_LENGTH, required: true, validator: sanitizeAndValidateString },
    { key: 'phone', max: MAX_PHONE_LENGTH, required: false, validator: validatePhone },
    { key: 'addressStreet', max: MAX_ADDRESS_LENGTH, required: false, validator: sanitizeAndValidateString },
    { key: 'addressNumber', max: MAX_ADDRESS_LENGTH, required: false, validator: validateAddressNumber },
    { key: 'addressNeighborhood', max: MAX_ADDRESS_LENGTH, required: false, validator: sanitizeAndValidateString },
    { key: 'addressCity', max: MAX_ADDRESS_LENGTH, required: false, validator: sanitizeAndValidateString },
    { key: 'details', max: MAX_DETAILS_LENGTH, required: true, validator: sanitizeAndValidateString },
    { key: 'logo', max: MAX_LOGO_LENGTH, required: false, validator: validateLogo },
  ];
  for (const { key, max, required, validator } of fieldsToValidate) {
    const value = promptInfo[key];
    if (required && !value) return res.status(400).json({ error: `O campo ${key} é obrigatório.` });
    if (value) {
      const validationResult = validator(value, max, key);
      if (typeof validationResult === 'string' && (validationResult.startsWith('O campo') || validationResult.startsWith('O logo'))) {
        return res.status(400).json({ error: validationResult });
      }
      sanitizedPromptInfo[key] = validationResult;
    } else if (!required) {
      sanitizedPromptInfo[key] = value;
    }
  }

  try {
    // Check user role
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${user.token}` } }
    });
    const { data: profile, error: profileError } = await supabaseAuth.from('profiles').select('role').eq('id', user.id).single();
    if (profileError) throw new Error(`Acesso negado ou perfil não encontrado no Supabase: ${profileError.message}. Verifique a configuração do Supabase.`);
    const userRole = profile?.role || 'free';
    if (!['admin', 'pro', 'dev', 'free'].includes(userRole)) {
      return res.status(403).json({ error: 'Acesso negado. A geração de arte requer um plano Pro.' });
    }
    
    // --- REAL AI GENERATION FLOW ---
    console.log(`[${user.id}] Step 1: Generating detailed prompt for user ${user.email}...`);
    const detailedPrompt = await generateDetailedPrompt(sanitizedPromptInfo.details);
    console.log(`[${user.id}] Step 1 Complete. Detailed prompt (first 100 chars): ${detailedPrompt.substring(0, 100)}...`);

    console.log(`[${user.id}] Step 2: Generating image with Freepik...`);
    const generatedImageUrl = await generateImage(detailedPrompt);
    console.log(`[${user.id}] Step 2 Complete. Generated URL: ${generatedImageUrl}`);

    console.log(`[${user.id}] Step 3: Uploading image to Supabase for user ${user.id}...`);
    const imagePath = await uploadImageToSupabase(generatedImageUrl, user.id);
    console.log(`[${user.id}] Step 3 Complete. Supabase path: ${imagePath}`);

    console.log(`[${user.id}] Step 4: Saving record to database for user ${user.id}...`);
    const { data: image, error: dbError } = await supabaseService
      .from('images')
      .insert({
        user_id: user.id,
        prompt: detailedPrompt,
        image_url: imagePath, // Store the path, not the public URL
        business_info: sanitizedPromptInfo,
      })
      .select()
      .single();

    if (dbError) {
      console.error(`[${user.id}] DB Insert Error:`, dbError);
      const errorMessage = dbError.message || 'Erro desconhecido ao inserir no banco de dados Supabase.';
      return res.status(500).json({ error: `Erro ao salvar a imagem no banco de dados Supabase: ${errorMessage}. Verifique a tabela 'images' e suas permissões.` });
    }
    console.log(`[${user.id}] Step 4 Complete. Image ID: ${image.id}`);

    res.json({ 
      message: 'Arte gerada com sucesso!',
      image: image
    });

  } catch (error) {
    // Pass the error to the global error handler
    next(error);
  }
});

// Admin endpoints
app.get('/api/admin/images', authenticateToken, checkAdminOrDev, async (req, res, next) => { // Added 'next'
    try {
        const { data, error } = await supabaseService.from('images').select('*');
        if (error) throw error;
        res.json({ images: data });
    } catch (error) {
        next(error); // Pass to global error handler
    }
});

app.delete('/api/admin/images/:id', authenticateToken, checkAdminOrDev, async (req, res, next) => { // Added 'next'
    const { id } = req.params;
    const { imageUrl } = req.body; // This is now the file path
    if (!imageUrl) return res.status(400).json({ error: 'Caminho da imagem é obrigatório.' });
    try {
        const { error: dbError } = await supabaseService.from('images').delete().eq('id', id);
        if (dbError) throw dbError;
        
        const { error: storageError } = await supabaseService.storage.from('generated-arts').remove([imageUrl]);
        if (storageError) console.warn("Storage Delete Warning:", storageError);
        
        res.json({ message: 'Imagem deletada com sucesso.' });
    } catch (error) {
        next(error); // Pass to global error handler
    }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// NEW: Global Error handling middleware (MUST be the last app.use())
app.use((err, req, res, next) => {
  console.error("Unhandled Backend Error Caught by Global Handler:", err);
  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor. Por favor, tente novamente mais tarde.",
    details: err.stack || "Detalhes do erro não disponíveis."
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});