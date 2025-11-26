const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase setup using SERVICE_KEY for secure backend operations
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("FATAL: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Assuming frontend runs on 3000
app.use(express.json());

// --- Rate Limiting Middleware (Issue 3 Fix) ---
const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
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
    // Verify token using Supabase's built-in JWT verification
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    req.user = user;
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

  // --- 2. Validação de Entrada (Implementação da Solução 2) ---
  const MAX_DETAILS_LENGTH = 1000;
  const MAX_COMPANY_NAME_LENGTH = 100;

  if (!promptInfo.details || promptInfo.details.length > MAX_DETAILS_LENGTH) {
      return res.status(400).json({ error: `O briefing (detalhes) é obrigatório e não pode exceder ${MAX_DETAILS_LENGTH} caracteres.` });
  }
  if (!promptInfo.companyName || promptInfo.companyName.length > MAX_COMPANY_NAME_LENGTH) {
      return res.status(400).json({ error: `O nome da empresa é obrigatório e não pode exceder ${MAX_COMPANY_NAME_LENGTH} caracteres.` });
  }
  // A validação do logo (Base64) é complexa e deve ser movida para o Storage, mas por enquanto, 
  // vamos focar na validação de texto.
  // FIM da Validação de Entrada

  try {
    // 1.4. Buscar Role do Usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'client';

    // 1.5. Verificar Autorização/Role (CORREÇÃO: Usar 'admin' ou 'pro')
    const AUTHORIZED_ROLES = ['admin', 'pro'];
    
    if (!AUTHORIZED_ROLES.includes(userRole)) {
      return res.status(403).json({ error: 'Acesso negado. A geração de arte requer um plano pago (Pro).' });
    }
    
    // Se for 'admin' ou 'pro', a execução continua.

    // 2. Gerar Prompt Detalhado (Perplexity/Gemini)
    // const detailedPrompt = await generateDetailedPrompt(promptInfo); 

    // 3. Gerar Imagem (Freepik/DALL-E)
    // const imageUrl = await generateImage(detailedPrompt); 
    
    // --- MOCK DATA FOR DEMO ---
    const mockImageUrl = `${user.id}/mock-${Date.now()}.png`;
    
    // 4. Upload da Imagem (Simulação de upload)
    
    // 5. Salvar no Banco de Dados
    const { data: image, error: dbError } = await supabase
      .from('images')
      .insert({
        user_id: user.id,
        prompt: "Mock Prompt: " + promptInfo.details,
        image_url: mockImageUrl,
        business_info: promptInfo,
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