const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase Keys (Anon Key is hardcoded here for JWT verification isolation)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreW5iaWl4eGNmdHhndmpwanh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjQ3MTcsImV4cCI6MjA3OTc0MDcxN30.FoIp7_p8gI_-JTuL4UU75mfyw1kjUxj0fDvtx6ZwVAI";

// CORS Configuration (Issue 3 Fix: Remove fallback, enforce environment variable)
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("FATAL: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing.");
  process.exit(1);
}

if (!FRONTEND_URL) {
  console.error("FATAL: FRONTEND_URL environment variable is missing. Please set the URL of your frontend application.");
  process.exit(1);
}

// Client 1: Service Role Client (High Privilege - used for DB operations bypassing RLS)
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client 2: Anon Client (Low Privilege - used ONLY for JWT verification and RLS-protected reads)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Middleware
// Issue 3 Fix: Use mandatory FRONTEND_URL for CORS origin
app.use(cors({ origin: FRONTEND_URL })); 

// --- FIX 2: Set strict JSON body limit (50kb) to prevent DoS from large Base64 payloads ---
app.use(express.json({ limit: '50kb' }));

// Issue 2 Fix: Configure Express to trust proxy headers (important for user-based limiting behind load balancers)
app.set('trust proxy', 1); 

// --- Rate Limiting Middleware (Issue 2 Fix: Limit by User ID) ---
const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each user to 5 requests per windowMs
  keyGenerator: (req, res) => {
    // Use the authenticated user ID as the key
    return req.user.id; 
  },
  message: {
    error: "Muitas requisições de geração. Tente novamente em um minuto."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Auth Middleware ---
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ error: 'Token de autenticação ausente.' });

  try {
    // Verify token using the low-privilege Anon client
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    // Store the token for RLS-protected reads (Issue 1 Fix)
    req.user = { ...user, token }; 
    next();
  } catch (e) {
    console.error("JWT verification failed:", e);
    return res.status(403).json({ error: 'Falha na autenticação.' });
  }
};

// --- API Routes ---

app.post('/api/generate', authenticateToken, generationLimiter, async (req, res) => {
  const { promptInfo } = req.body;
  const user = req.user;

  // --- Input Validation and Sanitization ---
  const MAX_DETAILS_LENGTH = 1000;
  const MAX_COMPANY_NAME_LENGTH = 100;
  const MAX_ADDRESS_LENGTH = 100;
  const MAX_PHONE_LENGTH = 30;
  const MAX_LOGO_LENGTH = 40000; 

  // Regex patterns for strict validation
  const REGEX_ALPHANUMERIC_SPACES = /^[a-zA-Z0-9\s\u00C0-\u00FF.,\-&]*$/; // Allows basic punctuation and accents
  const REGEX_PHONE = /^[0-9\s\-\(\)\+]*$/; // Allows numbers, spaces, hyphens, parentheses, plus sign
  const REGEX_ADDRESS_NUMBER = /^[a-zA-Z0-9\s\-\/]*$/; // Allows numbers, letters, spaces, hyphens, slashes
  // Issue 2 Fix: Stricter Base64 body regex (A-Z, a-z, 0-9, +, /, =)
  const REGEX_BASE64_BODY = /^[A-Za-z0-9+/=]*$/; 

  const sanitizeAndValidateString = (value, maxLength, fieldName, regex = REGEX_ALPHANUMERIC_SPACES) => {
    if (typeof value !== 'string') {
      return `O campo ${fieldName} deve ser uma string.`;
    }
    if (value.length > maxLength) {
      return `O campo ${fieldName} não pode exceder ${maxLength} caracteres.`;
    }
    
    // Sanitize HTML
    const sanitizedValue = sanitizeHtml(value.trim(), {
      allowedTags: [], 
      allowedAttributes: {}, 
    });

    // Check against strict regex
    if (!regex.test(sanitizedValue)) {
        return `O campo ${fieldName} contém caracteres inválidos.`;
    }

    return sanitizedValue;
  };
  
  // Validation function for address number (using specific regex)
  const validateAddressNumber = (value) => {
    return sanitizeAndValidateString(value, MAX_ADDRESS_LENGTH, 'addressNumber', REGEX_ADDRESS_NUMBER);
  };
  
  // Validation function for phone (using specific regex)
  const validatePhone = (value) => {
    return sanitizeAndValidateString(value, MAX_PHONE_LENGTH, 'phone', REGEX_PHONE);
  };
  
  // Validation function for logo (Base64 check)
  const validateLogo = (value) => {
      if (!value) return null;
      
      // Check if it looks like a Base64 string (starts with data:image/...)
      if (!value.startsWith('data:image/')) {
          return "O logo não está no formato Base64 esperado.";
      }
      
      // Extract the Base64 body (after the header, e.g., data:image/png;base64,)
      const parts = value.split(',');
      if (parts.length !== 2) {
          return "Formato Base64 inválido.";
      }
      const base64Body = parts[1];
      
      // Check length
      if (base64Body.length > MAX_LOGO_LENGTH) {
          return `O logo não pode exceder ${MAX_LOGO_LENGTH} caracteres (aprox. 30KB).`;
      }
      
      // Issue 2 Fix: Check Base64 body against strict Base64 character set
      if (!REGEX_BASE64_BODY.test(base64Body)) {
          return "O logo contém caracteres Base64 inválidos.";
      }

      // Return the original value (which is now validated for format and content)
      return value;
  };


  // Required fields check
  if (!promptInfo.details) return res.status(400).json({ error: "O briefing (detalhes) é obrigatório." });
  if (!promptInfo.companyName) return res.status(400).json({ error: "O nome da empresa é obrigatório." });

  // Validate and sanitize all fields
  const sanitizedPromptInfo = {};
  
  // Issue 4 Fix: Set address fields and phone to required: false
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
    
    if (required && !value) {
      return res.status(400).json({ error: `O campo ${key} é obrigatório.` });
    }

    if (value) {
      const validationResult = validator(value, max, key);
      if (typeof validationResult === 'string' && (validationResult.startsWith('O campo') || validationResult.startsWith('O logo') || validationResult.startsWith('Formato Base64'))) {
        return res.status(400).json({ error: validationResult });
      }
      sanitizedPromptInfo[key] = validationResult;
    } else if (!required) {
      sanitizedPromptInfo[key] = value; // Keep null/undefined if optional
    }
  }
  // END Input Validation and Sanitization

  try {
    // Issue 1 Fix: Use a client initialized with the user's JWT token for RLS-protected reads.
    // This ensures RLS is enforced when reading the profile/role.
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${user.token}` } }
    });

    // 1.4. Buscar Role do Usuário (Using the RLS-protected client)
    const { data: profile, error: profileError } = await supabaseAuth
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If RLS fails or profile doesn't exist, it will throw an error here.
      console.error("Profile Fetch Error (RLS enforced):", profileError);
      return res.status(403).json({ error: 'Acesso negado ou perfil não encontrado.' });
    }

    const userRole = profile?.role || 'free'; // Default to 'free' now

    // 1.5. Verificar Autorização/Role
    const AUTHORIZED_ROLES = ['admin', 'pro'];
    
    if (!AUTHORIZED_ROLES.includes(userRole)) {
      return res.status(403).json({ error: 'Acesso negado. A geração de arte requer um plano pago (Pro).' });
    }
    
    // If 'admin' or 'pro', execution continues.

    // 2. Gerar Prompt Detalhado (Perplexity/Gemini)
    // const detailedPrompt = await generateDetailedPrompt(sanitizedPromptInfo); 

    // 3. Gerar Imagem (Freepik/DALL-E)
    // const imageUrl = await generateImage(detailedPrompt); 
    
    // --- MOCK DATA FOR DEMO ---
    // The image path must start with the user ID for RLS to work (Issue 1 Fix)
    const mockImageUrl = `${user.id}/mock-${Date.now()}.png`; 
    
    // 4. Upload da Imagem (Simulação de upload)
    
    // 5. Salvar no Banco de Dados (Using the Service Role Client - RLS bypass needed for INSERT)
    const { data: image, error: dbError } = await supabaseService
      .from('images')
      .insert({
        user_id: user.id,
        prompt: "Mock Prompt: " + sanitizedPromptInfo.details,
        image_url: mockImageUrl,
        business_info: sanitizedPromptInfo, // Use sanitized data
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB Insert Error:", dbError);
      return res.status(500).json({ error: 'Erro ao salvar a imagem no banco de dados.' });
    }

    // 6. Retornar Sucesso
    res.json({ 
      message: 'Geração simulada concluída com sucesso.',
      image: image
    });

  } catch (error) {
    console.error("Generation Error:", error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor durante a geração.' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});