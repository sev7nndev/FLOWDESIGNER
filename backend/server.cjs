const express = require('express');
    const cors = require('cors');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const axios = require('axios');
    const { createClient } = require('@supabase/supabase-js');
    const jwt = require('jsonwebtoken');
    const rateLimit = require('express-rate-limit');
    const sanitizeHtml = require('sanitize-html');
    const { v4: uuidv4 } = require('uuid');
    const mercadopago = require('mercadopago'); // NEW: Mercado Pago SDK
    require('dotenv').config();

    const app = express();
    const PORT = process.env.PORT || 3001;

    // Environment Variables
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; 
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
    
    // NEW: Mercado Pago Environment Variables
    const MP_CLIENT_ID = process.env.MP_CLIENT_ID;
    const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET;
    const MP_REDIRECT_URI = process.env.MP_REDIRECT_URI;
    const MP_OWNER_ID = process.env.MP_OWNER_ID; // ID do usuário dono do SaaS no Supabase

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY || !GEMINI_API_KEY || !FREEPIK_API_KEY || !MP_CLIENT_ID || !MP_CLIENT_SECRET || !MP_REDIRECT_URI || !MP_OWNER_ID) {
      console.error("Missing one or more environment variables (Supabase, Gemini, Freepik, or Mercado Pago). Please check your .env.local file.");
      process.exit(1);
    }

    // Supabase Clients
    // Service Role Client (High Privilege)
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Anon Client (Low Privilege - for JWT verification)
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    // Mercado Pago Configuration (using the owner's credentials for OAuth flow)
    // Note: We initialize MP SDK later with the owner's access token for payments.

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

    // Trust proxy for correct IP identification in rate limiting
    app.set('trust proxy', 1);

    // Rate Limiting for generation endpoint (user-based)
    const generationLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5, // Limit each user to 5 requests per windowMs
      message: "Muitas requisições de geração. Por favor, tente novamente após um minuto.",
      standardHeaders: true, 
      legacyHeaders: false, 
      keyGenerator: (req, res) => req.user.id, 
    });

    // Helper function to verify JWT token
    const authenticateToken = async (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token de autenticação ausente.' });
      }

      try {
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

        if (error || !user) {
          console.error("JWT verification failed:", error?.message || "User not found");
          return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }

        req.user = { id: user.id, email: user.email, token: token }; 
        next();
      } catch (e) {
        console.error("Error during token authentication:", e.message);
        return res.status(500).json({ error: 'Erro interno do servidor ao autenticar token.' });
      }
    };

    // Helper function to check if user is admin or dev
    const checkAdminOrDev = async (req, res, next) => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Não autenticado.' });
      }

      try {
        const { data: profile, error } = await supabaseService
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || !profile || !['admin', 'dev'].includes(profile.role)) {
          return res.status(403).json({ error: 'Acesso negado. Apenas administradores e desenvolvedores podem realizar esta ação.' });
        }
        next();
      } catch (e) {
        console.error("Error checking admin/dev role:", e.message);
        return res.status(500).json({ error: 'Erro interno do servidor ao verificar permissões.' });
      }
    };
    
    // NEW: Helper function to check image quota and increment usage
    const checkImageQuota = async (userId) => {
        const now = new Date().toISOString();
        
        // 1. Fetch usage and plan data
        const { data: usageData, error: usageError } = await supabaseService
            .from('user_usage')
            .select('*, plan_settings(max_images_per_month, price)')
            .eq('user_id', userId)
            .single();

        if (usageError || !usageData) {
            console.error(`Quota check failed for user ${userId}:`, usageError?.message || 'Usage data not found.');
            // Default to BLOCKED if data is missing for safety
            return { status: 'BLOCKED', usage: null, plan: null, message: 'Falha ao verificar plano. Tente novamente.' };
        }
        
        const usage = usageData;
        const plan = usageData.plan_settings;
        const maxImages = plan.max_images_per_month;
        const currentUsage = usage.current_usage;
        const planId = usage.plan_id;
        
        // Check if cycle needs renewal (simple monthly check based on cycle_start_date)
        const cycleStartDate = new Date(usage.cycle_start_date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        let usageToUse = currentUsage;
        
        if (cycleStartDate < oneMonthAgo) {
            // Reset usage for new cycle
            const { error: resetError } = await supabaseService
                .from('user_usage')
                .update({ current_usage: 0, cycle_start_date: now })
                .eq('user_id', userId);
            
            if (resetError) {
                console.error(`Failed to reset usage for user ${userId}:`, resetError);
                // Continue with current usage if reset fails, to prevent over-usage
            } else {
                usageToUse = 0;
            }
        }
        
        // 2. Determine Quota Status
        const usagePercentage = (usageToUse / maxImages) * 100;
        
        if (usageToUse >= maxImages) {
            return { status: 'BLOCKED', usage: { ...usage, current_usage: usageToUse }, plan, message: `Limite de ${maxImages} imagens atingido para o plano ${planId}.` };
        }
        
        if (usagePercentage >= 80) {
            return { status: 'NEAR_LIMIT', usage: { ...usage, current_usage: usageToUse }, plan, message: `Você está perto do limite (${usageToUse}/${maxImages}).` };
        }
        
        return { status: 'ALLOWED', usage: { ...usage, current_usage: usageToUse }, plan };
    };
    
    // NEW: Helper function to increment usage
    const incrementUsage = async (userId) => {
        const { error } = await supabaseService
            .from('user_usage')
            .update({ current_usage: new Date().getTime() }) // Use current timestamp to force update
            .eq('user_id', userId)
            .increment('current_usage', 1);
            
        if (error) {
            console.error(`Failed to increment usage for user ${userId}:`, error);
            throw new Error('Falha ao registrar o uso da imagem.');
        }
    };

    // AI Prompt Generation (Refactored)
    async function generateDetailedPrompt(promptInfo) {
      const { companyName, phone, addressStreet, addressNumber, addressNeighborhood, addressCity, details } = promptInfo;
      
      // Format address and services list for the AI
      const address = [addressStreet, addressNumber, addressNeighborhood, addressCity]
        .filter(Boolean)
        .join(', ');
        
      const servicesList = details.split('.').map(s => s.trim()).filter(s => s.length > 5).join('; ');
      
      const prompt = `Você é um designer profissional de social media. Gere uma arte de FLYER VERTICAL em alta qualidade, com aparência profissional, inspirada em flyers modernos de pet shop, oficina mecânica, barbearia, lanchonete, salão de beleza, imobiliária e clínica, com:

- composição bem organizada;  
- tipografia clara, com hierarquia entre título, subtítulo e lista de serviços;  
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
- Usar cores coerentes com o nicho.  
- Reservar espaço para o logotipo.  
- Não inventar textos aleatórios; usar somente as informações fornecidas.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }

    // Freepik Image Generation
    async function generateImage(detailedPrompt) {
      try {
        const response = await axios.post(
          'https://api.freepik.com/v1/ai/image-generator',
          {
            prompt: detailedPrompt,
            art_style: 'photorealistic', 
            aspect_ratio: '3:4', 
            output_type: 'url',
            num_images: 1,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Freepik-API-Key': FREEPIK_API_KEY,
            },
          }
        );

        if (response.data && response.data.data && response.data.data.length > 0) {
          return response.data.data[0].image_url;
        } else {
          throw new Error('Nenhuma imagem gerada pela Freepik.');
        }
      } catch (error) {
        console.error('Erro ao gerar imagem com Freepik:', error.response ? error.response.data : error.message);
        throw new Error('Falha ao gerar imagem. Tente novamente mais tarde.');
      }
    }

    // Supabase Storage Upload
    async function uploadImageToSupabase(imageUrl, userId) {
      try {
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        const actualContentType = imageResponse.headers['content-type'] || 'image/png'; 

        const filePath = `${userId}/${uuidv4()}.png`; 
        const { data, error } = await supabaseService.storage
          .from('generated-arts')
          .upload(filePath, imageBuffer, {
            contentType: actualContentType, 
            upsert: false,
          });

        if (error) {
          throw new Error(`Erro ao fazer upload para Supabase Storage: ${error.message}`);
        }
        return data.path; 
      } catch (error) {
        console.error('Erro ao fazer upload da imagem para o Supabase Storage:', error.message);
        throw new Error('Falha ao salvar a imagem gerada.');
      }
    }

    // --- API Endpoints ---
    
    // NEW: Get Plan Settings
    app.get('/api/plan-settings', async (req, res, next) => {
        try {
            const { data, error } = await supabaseService
                .from('plan_settings')
                .select('*')
                .order('price', { ascending: true });
                
            if (error) throw new Error(error.message);
            
            res.json({ plans: data });
        } catch (error) {
            next(error);
        }
    });
    
    // NEW: Check Quota Endpoint
    app.get('/api/check-quota', authenticateToken, async (req, res, next) => {
        try {
            const quotaResponse = await checkImageQuota(req.user.id);
            res.json(quotaResponse);
        } catch (error) {
            next(error);
        }
    });

    // Generate Image Endpoint (Adjusted for Quota)
    app.post('/api/generate', authenticateToken, generationLimiter, async (req, res, next) => {
      const { promptInfo } = req.body;
      const user = req.user;

      if (!promptInfo) {
        return res.status(400).json({ error: "Corpo da requisição inválido: objeto 'promptInfo' ausente." });
      }

      // Input validation and sanitization
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
      
      const MAX_LOGO_BASE64_LENGTH_SERVER = 40000; 
      if (sanitizedPromptInfo.logo && sanitizedPromptInfo.logo.length > MAX_LOGO_BASE64_LENGTH_SERVER) {
        return res.status(400).json({ error: `O logo é muito grande. O tamanho máximo permitido é de ${Math.round(MAX_LOGO_BASE64_LENGTH_SERVER / 1.33 / 1024)}KB.` });
      }

      try {
        // --- NEW: Quota Check ---
        const quotaResponse = await checkImageQuota(user.id);
        
        if (quotaResponse.status === 'BLOCKED') {
            // Return 403 and the quota message
            return res.status(403).json({ error: quotaResponse.message, quotaStatus: 'BLOCKED', usage: quotaResponse.usage, plan: quotaResponse.plan });
        }
        // NEAR_LIMIT status is handled by the frontend via the check-quota endpoint/response
        
        // --- REAL AI GENERATION FLOW ---
        console.log(`[${user.id}] Step 1: Generating detailed prompt for user ${user.email}...`);
        const detailedPrompt = await generateDetailedPrompt(sanitizedPromptInfo);
        console.log(`[${user.id}] Step 1 Complete. Detailed prompt (first 100 chars): ${detailedPrompt.substring(0, 100)}...`);

        console.log(`[${user.id}] Step 2: Generating image with Freepik...`);
        const generatedImageUrl = await generateImage(detailedPrompt);
        console.log(`[${user.id}] Step 2 Complete. Generated URL: ${generatedImageUrl}`);

        console.log(`[${user.id}] Step 3: Uploading image to Supabase for user ${user.id}...`);
        const imagePath = await uploadImageToSupabase(generatedImageUrl, user.id);
        console.log(`[${user.id}] Step 3 Complete. Supabase path: ${imagePath}`);

        console.log(`[${user.id}] Step 4: Saving record to database and incrementing usage for user ${user.id}...`);
        
        // 4a. Save record
        const { data: image, error: dbError } = await supabaseService
          .from('images')
          .insert({
            user_id: user.id,
            prompt: detailedPrompt,
            image_url: imagePath, 
            business_info: sanitizedPromptInfo,
          })
          .select()
          .single();

        if (dbError) {
          console.error(`[${user.id}] DB Insert Error:`, dbError);
          const errorMessage = dbError.message || 'Erro desconhecido ao inserir no banco de dados Supabase.';
          return res.status(500).json({ error: `Erro ao salvar a imagem no banco de dados Supabase: ${errorMessage}. Verifique a tabela 'images' e suas permissões.` });
        }
        
        // 4b. Increment usage
        await incrementUsage(user.id);
        
        console.log(`[${user.id}] Step 4 Complete. Image ID: ${image.id}`);

        res.json({ 
          message: 'Arte gerada com sucesso!',
          image: image
        });

      } catch (error) {
        next(error);
      }
    });

    // Admin endpoint to get all generated images
    app.get('/api/admin/images', authenticateToken, checkAdminOrDev, async (req, res, next) => {
      try {
        const { data, error } = await supabaseService
          .from('images')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching all images for admin:", error);
          throw new Error(error.message);
        }

        res.json({ images: data });
      } catch (error) {
        next(error);
      }
    });

    // Admin endpoint to delete a generated image
    app.delete('/api/admin/images/:id', authenticateToken, checkAdminOrDev, async (req, res, next) => {
      const { id } = req.params;
      const { imageUrl } = req.body; 

      if (!imageUrl) {
        return res.status(400).json({ error: "Caminho da imagem é obrigatório para exclusão do storage." });
      }

      try {
        // 1. Delete from Supabase Storage
        const { error: storageError } = await supabaseService.storage
          .from('generated-arts')
          .remove([imageUrl]);

        if (storageError) {
          console.error(`Error deleting image from storage (${imageUrl}):`, storageError);
        }

        // 2. Delete from Supabase Database
        const { error: dbError } = await supabaseService
          .from('images')
          .delete()
          .eq('id', id);

        if (dbError) {
          console.error(`Error deleting image from DB (${id}):`, dbError);
          throw new Error(dbError.message);
        }

        res.json({ message: 'Imagem deletada com sucesso.' });
      } catch (error) {
        next(error);
      }
    });

    // Admin endpoint to upload a landing carousel image (NEW)
    app.post('/api/admin/landing-images/upload', authenticateToken, checkAdminOrDev, async (req, res, next) => {
      const { fileBase64, fileName, userId } = req.body;
      const user = req.user; 

      if (!fileBase64 || !fileName || !userId) {
        return res.status(400).json({ error: "Dados de arquivo incompletos." });
      }

      if (user.id !== userId) {
        return res.status(403).json({ error: "Ação não autorizada para o usuário especificado." });
      }

      try {
        const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          throw new Error('Formato de base64 inválido.');
        }
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        const MAX_LANDING_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; 
        if (buffer.length > MAX_LANDING_IMAGE_SIZE_BYTES) {
            return res.status(400).json({ error: `O arquivo é muito grande. O tamanho máximo permitido é de ${MAX_LANDING_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.` });
        }

        const fileExtension = fileName.split('.').pop();
        const filePath = `landing-carousel/${userId}/${uuidv4()}.${fileExtension}`; 

        // 1. Upload to Supabase Storage using service role key
        const { data: uploadData, error: uploadError } = await supabaseService.storage
          .from('landing-carousel')
          .upload(filePath, buffer, {
            contentType: contentType,
            upsert: false,
          });

        if (uploadError) {
          console.error(`Error uploading to Supabase Storage:`, uploadError);
          throw new Error(`Falha no upload para o armazenamento: ${uploadError.message}`);
        }

        // 2. Insert record into Supabase Database
        const { data: dbData, error: dbError } = await supabaseService
          .from('landing_carousel_images')
          .insert({ image_url: filePath, created_by: userId })
          .select('id, image_url, sort_order')
          .single();

        if (dbError || !dbData) {
          await supabaseService.storage.from('landing-carousel').remove([filePath]);
          console.error(`Error inserting into DB:`, dbError);
          throw new Error(`Falha ao registrar imagem no banco de dados: ${dbError?.message || 'Erro desconhecido'}`);
        }
        
        const { data: { publicUrl } } = supabaseService.storage
            .from('landing-carousel')
            .getPublicUrl(dbData.image_url);
            
        const newLandingImage = {
            id: dbData.id,
            url: publicUrl,
            sortOrder: dbData.sort_order
        };

        res.status(200).json({ message: 'Imagem da landing page carregada com sucesso!', image: newLandingImage });

      } catch (error) {
        next(error);
      }
    });


    // Admin endpoint to delete a landing carousel image
    app.delete('/api/admin/landing-images/:id', authenticateToken, checkAdminOrDev, async (req, res, next) => {
      const { id } = req.params;
      const { imagePath } = req.body; 

      if (!imagePath) {
        return res.status(400).json({ error: "Caminho da imagem é obrigatório para exclusão do storage." });
      }

      try {
        // 1. Delete from Supabase Storage
        const { error: storageError } = await supabaseService.storage
          .from('landing-carousel')
          .remove([imagePath]);

        if (storageError) {
          console.error(`Error deleting landing image from storage (${imagePath}):`, storageError);
        }

        // 2. Delete from Supabase Database
        const { error: dbError } = await supabaseService
          .from('landing_carousel_images')
          .delete()
          .eq('id', id);

        if (dbError) {
          console.error(`Error deleting landing image from DB (${id}):`, dbError);
          throw new Error(dbError.message);
        }

        res.json({ message: 'Imagem da landing page deletada com sucesso.' });
      } catch (error) {
        next(error);
      }
    });
    
    // NEW: Admin endpoint to update plan settings
    app.put('/api/admin/plan-settings/update', authenticateToken, checkAdminOrDev, async (req, res, next) => {
        const { plans } = req.body;
        const userId = req.user.id;
        
        if (!Array.isArray(plans) || plans.length === 0) {
            return res.status(400).json({ error: "Lista de planos inválida." });
        }
        
        try {
            const updates = plans.map(plan => ({
                id: plan.id,
                price: plan.price,
                max_images_per_month: plan.max_images_per_month,
                updated_by: userId,
                updated_at: new Date().toISOString()
            }));
            
            // Use upsert to update existing or insert new plans
            const { error } = await supabaseService
                .from('plan_settings')
                .upsert(updates, { onConflict: 'id' });
                
            if (error) {
                console.error("Error updating plan settings:", error);
                throw new Error(error.message);
            }
            
            res.json({ message: 'Configurações de planos atualizadas com sucesso.' });
        } catch (error) {
            next(error);
        }
    });
    
    // NEW: Mercado Pago OAuth Endpoints
    
    // 1. Redirect to Mercado Pago authorization
    app.get('/api/admin/mp-connect', authenticateToken, checkAdminOrDev, (req, res) => {
        const authUrl = `https://auth.mercadopago.com/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${MP_REDIRECT_URI}`;
        res.redirect(authUrl);
    });
    
    // 2. Handle Callback and save tokens
    app.get('/api/admin/mp-callback', authenticateToken, checkAdminOrDev, async (req, res, next) => {
        const { code, state } = req.query;
        const userId = req.user.id;
        
        if (!code) {
            return res.status(400).send('Autorização negada ou código ausente.');
        }
        
        try {
            // Exchange code for tokens
            const tokenResponse = await axios.post('https://api.mercadopago.com/oauth/token', {
                client_id: MP_CLIENT_ID,
                client_secret: MP_CLIENT_SECRET,
                code: code,
                redirect_uri: MP_REDIRECT_URI,
                grant_type: 'authorization_code'
            });
            
            const { access_token, refresh_token, expires_in, token_type, scope } = tokenResponse.data;
            
            // Save tokens to owners_payment_accounts table
            const { error } = await supabaseService
                .from('owners_payment_accounts')
                .upsert({
                    owner_id: MP_OWNER_ID, // Use o ID do dono do SaaS
                    access_token,
                    refresh_token,
                    expires_in,
                    token_type,
                    scope,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'owner_id' });
                
            if (error) {
                console.error("Error saving MP tokens:", error);
                throw new Error('Falha ao salvar tokens do Mercado Pago no banco de dados.');
            }
            
            // Redirect back to the Dev Panel with success message
            res.redirect(`http://localhost:3000/app/dev-panel?mp_status=success`);
            
        } catch (error) {
            console.error("Mercado Pago OAuth Error:", error.response ? error.response.data : error.message);
            res.redirect(`http://localhost:3000/app/dev-panel?mp_status=error&message=Falha na conexão com Mercado Pago.`);
        }
    });
    
    // NEW: Endpoint to initiate subscription (Placeholder for real payment logic)
    app.post('/api/subscribe', authenticateToken, async (req, res, next) => {
        const { planId } = req.body;
        const userId = req.user.id;
        
        if (!['starter', 'pro'].includes(planId)) {
            return res.status(400).json({ error: "Plano inválido." });
        }
        
        try {
            // 1. Get Owner's Mercado Pago Access Token
            const { data: ownerAccount, error: mpError } = await supabaseService
                .from('owners_payment_accounts')
                .select('access_token, refresh_token, expires_in, updated_at')
                .eq('owner_id', MP_OWNER_ID)
                .single();
                
            if (mpError || !ownerAccount) {
                throw new Error('Configuração de pagamento do SaaS ausente. Contate o administrador.');
            }
            
            let mpAccessToken = ownerAccount.access_token;
            
            // TODO: Implement token refresh logic here if needed (using refresh_token)
            // For simplicity in this step, we assume the token is valid or handle refresh externally.
            
            // 2. Initialize Mercado Pago SDK with Owner's Token
            mercadopago.configure({ access_token: mpAccessToken });
            
            // 3. Create Subscription/Payment (Placeholder Logic)
            // This is where you would integrate the actual Mercado Pago API call 
            // (e.g., creating a preference, subscription, or payment intent).
            
            // Example: Create a simple preference (not a subscription, just a one-time payment example)
            const preference = {
                items: [
                    {
                        title: `Assinatura Flow Designer - Plano ${planId.toUpperCase()}`,
                        quantity: 1,
                        currency_id: 'BRL',
                        unit_price: planId === 'starter' ? 29.99 : 49.99, // Hardcoded price for example, should use plan_settings
                    }
                ],
                payer: {
                    email: req.user.email,
                },
                back_urls: {
                    success: `${MP_REDIRECT_URI}?payment_status=success&plan=${planId}`,
                    failure: `${MP_REDIRECT_URI}?payment_status=failure&plan=${planId}`,
                    pending: `${MP_REDIRECT_URI}?payment_status=pending&plan=${planId}`,
                },
                auto_return: 'approved',
                external_reference: userId, // Link payment to user
            };
            
            const mpResponse = await mercadopago.preferences.create(preference);
            
            // 4. Return the payment URL to the frontend
            res.json({ 
                message: 'Iniciando pagamento...',
                paymentUrl: mpResponse.body.init_point, // URL to redirect the user
                preferenceId: mpResponse.body.id
            });
            
        } catch (error) {
            console.error("Mercado Pago Subscription Error:", error.response ? error.response.data : error.message);
            next(new Error('Falha ao iniciar o processo de pagamento.'));
        }
    });


    // Global Error Handler
    app.use((err, req, res, next) => {
      console.error("Global Error Handler:", err.stack);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Ocorreu um erro inesperado no servidor.';
      
      // Check if the error contains quota information (from /api/generate)
      if (err.quotaStatus) {
          return res.status(403).json({ 
              error: err.message, 
              quotaStatus: err.quotaStatus, 
              usage: err.usage, 
              plan: err.plan 
          });
      }
      
      res.status(statusCode).json({ error: message });
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });