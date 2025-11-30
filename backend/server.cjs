const express = require('express');
    const cors = require('cors');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const axios = require('axios');
    const { createClient } = require('@supabase/supabase-js');
    const jwt = require('jsonwebtoken');
    const rateLimit = require('express-rate-limit');
    const sanitizeHtml = require('sanitize-html');
    const { v4: uuidv4 } = require('uuid');
    require('dotenv').config();

    const app = express();
    const PORT = process.env.PORT || 3001;

    // Environment Variables
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // Added for JWT verification
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY || !GEMINI_API_KEY || !FREEPIK_API_KEY) {
      console.error("Missing one or more environment variables. Please check your .env.local file.");
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

    // Gemini AI Client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Middleware
    app.use(cors({
      origin: ['http://localhost:3000', 'https://ai.studio'], // Allow your frontend origin
      methods: ['GET', 'POST', 'DELETE', 'PUT'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express.json({ limit: '50mb' })); // Increased limit for potential base64 logos

    // Trust proxy for correct IP identification in rate limiting
    app.set('trust proxy', 1);

    // Rate Limiting for generation endpoint (user-based)
    const generationLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5, // Limit each user to 5 requests per windowMs
      message: "Muitas requisições de geração. Por favor, tente novamente após um minuto.",
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      keyGenerator: (req, res) => req.user.id, // Use authenticated user's ID for rate limiting
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

        req.user = { id: user.id, email: user.email, token: token }; // Attach user info to request
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

    // AI Prompt Generation
    async function generateDetailedPrompt(userPrompt) {
      const prompt = `Você é um especialista em marketing e design. Sua tarefa é transformar um pedido simples de um usuário em um briefing de imagem detalhado para uma IA de geração de imagens. O briefing deve ser extremamente descritivo, com foco em:
      - Estilo artístico (ex: fotorrealista, 3D render, ilustração vetorial, cyberpunk, minimalista, vintage)
      - Paleta de cores (ex: tons vibrantes, monocromático, pastel, neon)
      - Iluminação (ex: dramática, suave, luz natural, estúdio)
      - Composição (ex: close-up, grande angular, simétrico, dinâmico)
      - Elementos específicos (objetos, pessoas, texturas, fundos)
      - Atmosfera/Sentimento (ex: moderno, acolhedor, futurista, luxuoso)
      - Qualidade da imagem (ex: 8K, ultra detalhado, fotorrealista)

      O objetivo é que a IA crie uma imagem de alta qualidade que represente visualmente o negócio ou a promoção descrita.

      Exemplo de entrada do usuário: "Oficina mecânica completa. Faço lanternagem, pintura, rebaixamento, consertos de motor e troca de óleo. Faço tudo em carros nacionais e importados."

      Exemplo de saída detalhada: "Fotorrealista, imagem de alta resolução 8K de uma oficina mecânica moderna e limpa. A paleta de cores é dominada por tons de cinza escuro, preto e detalhes em vermelho vibrante e azul neon. A iluminação é dramática, com focos de luz destacando ferramentas cromadas e a silhueta de um carro esportivo sendo trabalhado. Composição em grande angular mostrando diferentes estações de trabalho: uma área de pintura com um carro sendo preparado, uma área de lanternagem com ferramentas específicas, e um elevador com um carro importado. Detalhes como respingos de óleo limpos no chão, pneus empilhados e um logotipo sutil da oficina na parede. A atmosfera é de profissionalismo, tecnologia e eficiência. Foco em texturas metálicas e reflexos."

      Agora, transforme o seguinte pedido do usuário em um briefing detalhado para a IA: "${userPrompt}"`;

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
            art_style: 'photorealistic', // You can make this dynamic if needed
            aspect_ratio: '3:4', // Common for flyers/social media posts
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

        const filePath = `${userId}/${uuidv4()}.png`; // Store images under user's ID
        const { data, error } = await supabaseService.storage
          .from('generated-arts')
          .upload(filePath, imageBuffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (error) {
          throw new Error(`Erro ao fazer upload para Supabase Storage: ${error.message}`);
        }
        return data.path; // Return the path in the bucket
      } catch (error) {
        console.error('Erro ao fazer upload da imagem para o Supabase Storage:', error.message);
        throw new Error('Falha ao salvar a imagem gerada.');
      }
    }

    // --- API Endpoints ---

    // Generate Image Endpoint
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
        logo: promptInfo.logo // Logo is base64, handled separately
      };

      if (!sanitizedPromptInfo.companyName || !sanitizedPromptInfo.details) {
        return res.status(400).json({ error: "Nome da empresa e detalhes são obrigatórios." });
      }

      try {
        // Check user role and generation count
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${user.token}` } }
        });
        const { data: profile, error: profileError } = await supabaseAuth.from('profiles').select('role, generations_count').eq('id', user.id).single();
        if (profileError) throw new Error(`Acesso negado ou perfil não encontrado no Supabase: ${profileError.message}. Verifique a configuração do Supabase.`);
        
        const userRole = profile?.role || 'free';
        const generationsCount = profile?.generations_count || 0;

        if (userRole === 'free' && generationsCount >= 3) {
          return res.status(403).json({ error: 'Você atingiu o limite de 3 gerações gratuitas. Faça upgrade para um plano pago para continuar gerando artes.' });
        }
        
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

        // Increment generations_count for free users
        if (userRole === 'free') {
            const { error: updateError } = await supabaseService
                .from('profiles')
                .update({ generations_count: generationsCount + 1 })
                .eq('id', user.id);
            if (updateError) {
                console.error(`[${user.id}] Error incrementing generations_count:`, updateError);
                // This is a non-critical error, but should be logged.
            }
        }

        res.json({ 
          message: 'Arte gerada com sucesso!',
          image: image
        });

      } catch (error) {
        // Pass the error to the global error handler
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
      const { imageUrl } = req.body; // This is the path in storage, e.g., "user-id/uuid.png"

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
          // Continue to delete from DB even if storage fails, to keep DB consistent
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
      const user = req.user; // Authenticated user from token

      if (!fileBase64 || !fileName || !userId) {
        return res.status(400).json({ error: "Dados de arquivo incompletos." });
      }

      // Security check: Ensure the userId in the body matches the authenticated user's ID
      // This prevents a dev/admin from uploading files under another user's ID if they tried to manipulate the request.
      if (user.id !== userId) {
        return res.status(403).json({ error: "Ação não autorizada para o usuário especificado." });
      }

      try {
        // Extract file type and base64 data
        const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          throw new Error('Formato de base64 inválido.');
        }
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        // --- SERVER-SIDE FILE SIZE VALIDATION (Issue 1 Fix) ---
        const MAX_LANDING_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
        if (buffer.length > MAX_LANDING_IMAGE_SIZE_BYTES) {
            return res.status(400).json({ error: `O arquivo é muito grande. O tamanho máximo permitido é de ${MAX_LANDING_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.` });
        }
        // --- END SERVER-SIDE FILE SIZE VALIDATION ---

        const fileExtension = fileName.split('.').pop();
        const filePath = `landing-carousel/${userId}/${uuidv4()}.${fileExtension}`; // Store under bucket/user's ID

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
          // If DB insert fails, try to remove the uploaded file from storage
          await supabaseService.storage.from('landing-carousel').remove([filePath]);
          console.error(`Error inserting into DB:`, dbError);
          throw new Error(`Falha ao registrar imagem no banco de dados: ${dbError?.message || 'Erro desconhecido'}`);
        }
        
        // Get public URL for the newly uploaded image
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
      const { imagePath } = req.body; // This is the path in storage, e.g., "user-id/uuid.png"

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
          // Continue to delete from DB even if storage fails, to keep DB consistent
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


    // Global Error Handler
    app.use((err, req, res, next) => {
      console.error("Global Error Handler:", err.stack);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Ocorreu um erro inesperado no servidor.';
      res.status(statusCode).json({ error: message });
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });