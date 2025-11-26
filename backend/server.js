const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// API & Supabase Keys
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreW5iaWl4eGNmdHhndmpwanh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjQ3MTcsImV4cCI6MjA3OTc0MDcxN30.FoIp7_p8gI_-JTuL4UU75mfyw1kjUxj0fDvtx6ZwVAI";

const FRONTEND_URL = process.env.FRONTEND_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PERPLEXITY_API_KEY || !FREEPIK_API_KEY) {
  console.error("FATAL: Uma ou mais chaves de API (Supabase, Perplexity, Freepik) estão faltando.");
  process.exit(1);
}
if (!FRONTEND_URL) {
  console.error("FATAL: FRONTEND_URL environment variable is missing.");
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

// --- AI Helper Functions ---

/**
 * Generates a detailed image prompt using Perplexity AI.
 * @param {object} businessInfo - Sanitized business information.
 * @returns {Promise<string>} - The detailed prompt for the image generation AI.
 */
const generateDetailedPrompt = async (businessInfo) => {
  const systemPrompt = `
    Você é um especialista em engenharia de prompts para uma IA de geração de imagens comerciais (text-to-image).
    Sua tarefa é criar um prompt conciso e altamente detalhado para gerar o visual principal de um flyer profissional.
    O estilo visual DEVE ser: "3D commercial illustration, clean composition, vibrant colors, studio lighting, high detail, photorealistic elements with a polished, slightly stylized feel like a CGI render or Unreal Engine cinematic. Focus on creating a visually appealing scene that leaves ample space for text overlays (header, footer, and lists)."
    Analise o JSON do negócio e crie um prompt que capture a essência do serviço, mantendo o estilo visual obrigatório.
    NÃO adicione texto, logos ou informações de contato no prompt. Apenas a cena visual.
    Exemplo de output para uma oficina: "A dynamic shot of a modern, glossy black sports car in a clean, well-lit garage, surrounded by professional tools neatly arranged. The focus is on the car's sleek design, with dramatic studio lighting highlighting its curves. The background is slightly blurred to emphasize the vehicle. 3D commercial illustration style, vibrant, CGI render."
  `;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'llama-3-sonar-large-32k-online',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Gere o prompt para o seguinte negócio: ${JSON.stringify(businessInfo)}` }
      ],
    }, {
      headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}` }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Perplexity API Error:", error.response ? error.response.data : error.message);
    throw new Error("Falha ao gerar o prompt detalhado com a IA.");
  }
};

/**
 * Generates an image using Freepik API.
 * @param {string} detailedPrompt - The prompt from Perplexity.
 * @returns {Promise<Buffer>} - The image data as a Buffer.
 */
const generateImage = async (detailedPrompt) => {
  try {
    // 1. Request image generation
    const generationResponse = await axios.post('https://api.freepik.com/v1/images/generate', {
      prompt: detailedPrompt,
      size: "1024x1792", // Flyer aspect ratio (approx 9:16)
      style: "3d" // Using Freepik's style preset for consistency
    }, {
      headers: { 
        'Authorization': `Bearer ${FREEPIK_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const imageData = generationResponse.data.data;
    if (!imageData || !imageData.id) {
        throw new Error("A API do Freepik não retornou um ID de imagem válido.");
    }

    // 2. Poll for the result
    let finalImage;
    for (let i = 0; i < 10; i++) { // Poll up to 10 times (e.g., 50 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        const pollResponse = await axios.get(`https://api.freepik.com/v1/images/generate/${imageData.id}`, {
            headers: { 'Authorization': `Bearer ${FREEPIK_API_KEY}` }
        });
        
        if (pollResponse.data.data.status === 'completed') {
            finalImage = pollResponse.data.data;
            break;
        }
    }

    if (!finalImage || !finalImage.data[0].url) {
        throw new Error("A geração da imagem demorou muito ou falhou no Freepik.");
    }

    // 3. Download the final image
    const imageDownloadResponse = await axios.get(finalImage.data[0].url, { responseType: 'arraybuffer' });
    return Buffer.from(imageDownloadResponse.data);

  } catch (error) {
    console.error("Freepik API Error:", error.response ? error.response.data : error.message);
    throw new Error("Falha ao gerar a imagem com a IA.");
  }
};

/**
 * Uploads an image buffer to Supabase Storage.
 * @param {Buffer} imageBuffer - The image data.
 * @param {string} userId - The ID of the user uploading the image.
 * @returns {Promise<string>} - The public path of the uploaded image.
 */
const uploadImageToSupabase = async (imageBuffer, userId) => {
    const fileName = `${userId}/${uuidv4()}.png`;
    const { data, error } = await supabaseService.storage
        .from('generated-arts')
        .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: false
        });

    if (error) {
        console.error("Supabase Upload Error:", error);
        throw new Error("Falha ao salvar a imagem no armazenamento.");
    }
    return data.path;
};


// Middleware
app.use(cors({ origin: FRONTEND_URL })); 
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
    if (error || !user) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = { ...user, token }; 
    next();
  } catch (e) {
    return res.status(403).json({ error: 'Falha na autenticação.' });
  }
};

const checkAdminOrDev = async (req, res, next) => {
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${req.user.token}` } }
    });
    const { data: profile, error } = await supabaseAuth.from('profiles').select('role').eq('id', req.user.id).single();
    if (error || !profile || !['admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    req.user.role = profile.role;
    next();
};

// --- API Routes ---

app.post('/api/generate', authenticateToken, generationLimiter, async (req, res) => {
  const { promptInfo } = req.body;
  const user = req.user;

  // (Input validation remains the same)
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
    if (profileError) throw new Error('Acesso negado ou perfil não encontrado.');
    const userRole = profile?.role || 'free';
    if (!['admin', 'pro', 'dev'].includes(userRole)) { // Added 'dev' for testing
      return res.status(403).json({ error: 'Acesso negado. A geração de arte requer um plano Pro.' });
    }
    
    // --- REAL AI GENERATION FLOW ---
    // 1. Generate Detailed Prompt
    const detailedPrompt = await generateDetailedPrompt(sanitizedPromptInfo);

    // 2. Generate Image
    const imageBuffer = await generateImage(detailedPrompt);
    
    // 3. Upload Image to Supabase
    const imageUrl = await uploadImageToSupabase(imageBuffer, user.id);
    
    // 4. Save to Database
    const { data: image, error: dbError } = await supabaseService
      .from('images')
      .insert({
        user_id: user.id,
        prompt: detailedPrompt,
        image_url: imageUrl,
        business_info: sanitizedPromptInfo,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB Insert Error:", dbError);
      return res.status(500).json({ error: 'Erro ao salvar a imagem no banco de dados.' });
    }

    // 5. Return Success
    res.json({ 
      message: 'Arte gerada com sucesso!',
      image: image
    });

  } catch (error) {
    console.error("Generation Error:", error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor durante a geração.' });
  }
});

// Admin endpoints remain the same
app.get('/api/admin/images', authenticateToken, checkAdminOrDev, async (req, res) => {
    try {
        const { data, error } = await supabaseService.from('images').select('*');
        if (error) throw error;
        res.json({ images: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/images/:id', authenticateToken, checkAdminOrDev, async (req, res) => {
    const { id } = req.params;
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Caminho da imagem é obrigatório.' });
    try {
        const { error: dbError } = await supabaseService.from('images').delete().eq('id', id);
        if (dbError) throw dbError;
        const { error: storageError } = await supabaseService.storage.from('generated-arts').remove([imageUrl]);
        if (storageError) console.warn("Storage Delete Warning:", storageError);
        res.json({ message: 'Imagem deletada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});