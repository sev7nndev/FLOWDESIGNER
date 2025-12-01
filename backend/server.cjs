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
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    // REMOVIDO: const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY || !GEMINI_API_KEY) {
      console.error("Missing one or more environment variables. Please check your .env.local file.");
      process.exit(1);
    }

    // Supabase Clients
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Gemini AI Client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // O modelo de imagem (imagen-3.0-generate-002) será usado para gerar a arte final
    const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });


    // Middleware
    app.use(cors({
      origin: ['http://localhost:3000', 'https://ai.studio'],
      methods: ['GET', 'POST', 'DELETE', 'PUT'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express.json({ limit: '50mb' }));
    app.set('trust proxy', 1);

    // Rate Limiting for generation endpoint (user-based)
    const generationLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 5,
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

    // --- Funções de Quota e Uso ---

    async function checkImageQuota(userId) {
        const { data: usageData, error: usageError } = await supabaseService
            .from('user_usage')
            .select('current_usage, plan_id, plans:plan_id(max_images_per_month)')
            .eq('user_id', userId)
            .single();

        if (usageError || !usageData) {
            console.error("Quota check failed:", usageError?.message);
            return { status: 'ERROR', message: 'Falha ao verificar o plano de uso.' };
        }

        const maxQuota = usageData.plans?.max_images_per_month || 0;
        const currentUsage = usageData.current_usage || 0;
        const planId = usageData.plan_id;

        // Admin/Devs têm uso ilimitado
        if (planId === 'admin' || planId === 'dev') {
            return { status: 'OK', message: 'Uso ilimitado.', currentUsage, maxQuota };
        }

        if (currentUsage >= maxQuota) {
            return { 
                status: 'BLOCKED', 
                message: `Você atingiu o limite de ${maxQuota} gerações para o seu plano (${planId}). Faça upgrade para continuar.` 
            };
        }

        return { status: 'OK', message: 'Geração permitida.', currentUsage, maxQuota };
    }

    async function incrementUsage(userId) {
        const { error } = await supabaseService
            .rpc('increment_user_usage', { user_id_input: userId });

        if (error) {
            console.error(`Falha ao incrementar o uso para o usuário ${userId}:`, error);
            throw new Error('Falha ao registrar o uso da imagem.');
        }
    }
    
    // --- Função de Construção do Prompt (Substitui generateDetailedPrompt) ---

    function constructFinalImagePrompt(businessInfo) {
        // Extrai informações para o prompt
        const { companyName, phone, addressStreet, addressNumber, addressNeighborhood, addressCity, details } = businessInfo;
        
        // Constrói a lista de serviços/diferenciais
        const servicesList = details.split('.').map(s => s.trim()).filter(s => s.length > 0).join('; ');
        
        // Constrói o endereço completo
        const address = [addressStreet, addressNumber, addressNeighborhood, addressCity]
            .filter(Boolean)
            .join(', ');

        // O prompt final segue o template fornecido pelo usuário
        const finalPrompt = `Você é um designer profissional de social media. Gere uma arte de FLYER VERTICAL em alta qualidade, com aparência profissional.
        Use como referência o nível de qualidade de flyers modernos de pet shop, oficina mecânica, barbearia, lanchonete, salão de beleza, imobiliária e clínica, com:
        - composição bem organizada;
        - tipografia clara e hierarquia entre título, subtítulo e lista de serviços;
        - ilustrações ou imagens relacionadas ao nicho;
        - fundo bem trabalhado, mas sem poluir o texto.
        Nicho do cliente: ${details}.
        Dados que DEVEM aparecer no flyer:
        - Nome da empresa: ${companyName}
        - Serviços principais: ${servicesList}
        - Telefone/WhatsApp: ${phone}
        - Endereço (se houver): ${address}
        Diretrizes de design:
        - Usar cores coerentes com o nicho (ex.: suaves para pet shop/saúde; escuras e fortes para mecânica/barbearia; quentes para lanchonete etc.).
        - Reservar espaço para o logotipo.
        - Não inventar textos aleatórios; use somente os dados fornecidos.`;

        return finalPrompt;
    }

    // --- Função de Geração de Imagem (Usando Gemini Image API) ---

    const processImageGeneration = async (jobId, userId, promptInfo) => {
        console.log(`[JOB ${jobId}] Iniciando processamento para o usuário ${userId}...`);
        
        const updateJobStatus = async (status, data = {}) => {
            const { error } = await supabaseService
                .from('generation_jobs')
                .update({ status, ...data, updated_at: new Date().toISOString() })
                .eq('id', jobId);
            if (error) {
                console.error(`[JOB ${jobId}] Falha ao atualizar o status para ${status}:`, error);
            }
        };

        try {
            // 1. Quota Check (Segurança extra, embora já checado no /api/generate)
            const quotaStatus = await checkImageQuota(userId);
            if (quotaStatus.status === 'BLOCKED') {
                throw new Error(quotaStatus.message);
            }

            // 2. Construção do Prompt Final
            const finalPrompt = constructFinalImagePrompt(promptInfo);
            console.log(`[JOB ${jobId}] Prompt Final (primeiros 100 chars): ${finalPrompt.substring(0, 100)}...`);

            // 3. Geração da Imagem (Gemini Image API)
            let imageBase64;
            try {
                const imageResult = await imageModel.generateContent({
                    model: 'imagen-3.0-generate-002',
                    prompt: finalPrompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/jpeg',
                        aspectRatio: '3:4', // Vertical Flyer
                    },
                });
                
                // Verifica se a imagem foi gerada
                if (!imageResult.generatedImages || imageResult.generatedImages.length === 0) {
                    throw new Error('A IA não conseguiu gerar a imagem com o prompt fornecido.');
                }
                
                imageBase64 = imageResult.generatedImages[0].image.imageBytes;
            } catch (geminiError) {
                console.error(`[JOB ${jobId}] Erro na API Gemini Image:`, geminiError);
                throw new Error('Falha na geração da imagem pela IA. Tente refinar o briefing.');
            }

            // 4. Upload e Registro no DB
            let imagePath;
            try {
                // 4a. Upload da imagem (Base64 para Buffer)
                const imageBuffer = Buffer.from(imageBase64, 'base64');
                const filePath = `${userId}/${uuidv4()}.jpeg`;
                
                const { data: uploadData, error: uploadError } = await supabaseService.storage
                    .from('generated-arts') // Usando o bucket existente
                    .upload(filePath, imageBuffer, {
                        contentType: 'image/jpeg',
                        upsert: false,
                    });

                if (uploadError) throw uploadError;
                imagePath = uploadData.path;

                // 4b. Salva o registro na tabela 'images'
                const { data: imageRecord, error: dbError } = await supabaseService
                    .from('images')
                    .insert({
                        user_id: userId,
                        prompt: finalPrompt, // Salva o prompt final detalhado
                        image_url: imagePath,
                        business_info: promptInfo,
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;
                
                // 4c. Incrementa o uso APÓS o sucesso total
                await incrementUsage(userId);
                
                // 4d. Obtém URL pública (para retornar ao frontend)
                const { data: { publicUrl } } = supabaseService.storage
                    .from('generated-arts')
                    .getPublicUrl(imagePath);
                    
                // 5. Sucesso: Atualiza o status do trabalho
                await updateJobStatus('COMPLETED', { image_url: publicUrl });
                console.log(`[JOB ${jobId}] Processamento concluído com sucesso. Path: ${imagePath}`);

            } catch (dbError) {
                console.error(`[JOB ${jobId}] Erro no Supabase (Upload/DB/Incremento):`, dbError);
                throw new Error('Falha ao salvar a imagem ou registrar o uso.');
            }

        } catch (error) {
            // 6. Falha: Atualiza o status do trabalho com a mensagem de erro
            const errorMessage = error.message || 'Erro desconhecido durante o processamento.';
            await updateJobStatus('FAILED', { error_message: errorMessage });
            console.error(`[JOB ${jobId}] Processamento falhou:`, errorMessage);
        }
    };

    // --- API Endpoints (Mantendo a lógica de fila) ---

    // Generate Image Endpoint (Inicia o trabalho)
    app.post('/api/generate', authenticateToken, generationLimiter, async (req, res, next) => {
      const { promptInfo } = req.body;
      const user = req.user;

      if (!promptInfo || !promptInfo.companyName || !promptInfo.details) {
        return res.status(400).json({ error: "Nome da empresa e detalhes são obrigatórios." });
      }
      
      // Server-side logo size validation (Mantido)
      const MAX_LOGO_BASE64_LENGTH_SERVER = 40000;
      if (promptInfo.logo && promptInfo.logo.length > MAX_LOGO_BASE64_LENGTH_SERVER) {
        return res.status(400).json({ error: `O logo é muito grande. O tamanho máximo permitido é de ${Math.round(MAX_LOGO_BASE64_LENGTH_SERVER / 1.33 / 1024)}KB.` });
      }
      
      // 1. Quota Check (Falha Rápida)
      const quotaResponse = await checkImageQuota(user.id);
      
      if (quotaResponse.status === 'BLOCKED') {
          return res.status(403).json({ 
              error: quotaResponse.message, 
              quotaStatus: 'BLOCKED'
          });
      }
      
      // 2. Cria o registro do trabalho no DB (PENDING)
      try {
          const { data, error } = await supabaseService
              .from('generation_jobs')
              .insert({ 
                  user_id: user.id, 
                  prompt_info: promptInfo,
                  status: 'PENDING'
              })
              .select('id')
              .single();

          if (error) throw error;
          
          const jobId = data.id;

          // 3. Inicia o processamento em background
          setTimeout(() => {
              processImageGeneration(jobId, user.id, promptInfo);
          }, 0); 

          // 4. Retorna 202 Accepted (Processando)
          res.status(202).json({ 
              message: 'Geração iniciada. Verifique o status em breve.', 
              jobId: jobId 
          });

      } catch (error) {
          console.error(`Erro ao iniciar o trabalho de geração:`, error);
          res.status(500).json({ error: 'Falha ao registrar o pedido de geração.' });
      }
    });

    // Endpoint /api/job-status/:jobId (Verifica o status do trabalho)
    app.get('/api/job-status/:jobId', authenticateToken, async (req, res) => {
        const { jobId } = req.params;
        const user = req.user;

        try {
            const { data, error } = await supabaseService
                .from('generation_jobs')
                .select('status, image_url, error_message')
                .eq('id', jobId)
                .eq('user_id', user.id)
                .single();

            if (error || !data) {
                return res.status(404).json({ error: 'Trabalho não encontrado ou acesso negado.' });
            }

            res.json({
                status: data.status,
                imageUrl: data.image_url,
                error: data.error_message
            });

        } catch (error) {
            console.error(`Erro ao buscar status do trabalho ${jobId}:`, error);
            res.status(500).json({ error: 'Falha ao buscar o status do trabalho.' });
        }
    });

    // Admin endpoint to get all generated images (Mantido)
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

    // Admin endpoint to delete a generated image (Mantido)
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

    // Admin endpoint to upload a landing carousel image (Mantido)
    app.post('/api/admin/landing-images/upload', authenticateToken, checkAdminOrDev, async (req, res, next) => {
      const { fileBase64, fileName, userId } = req.body;
      const user = req.user; // Authenticated user from token

      if (!fileBase64 || !fileName || !userId) {
        return res.status(400).json({ error: "Dados de arquivo incompletos." });
      }

      // Security check: Ensure the userId in the body matches the authenticated user's ID
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


    // Admin endpoint to delete a landing carousel image (Mantido)
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