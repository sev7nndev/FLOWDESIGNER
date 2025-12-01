const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const { processImageGeneration, checkAndIncrementQuota } = require('../services/generationService');
const { supabaseService, supabaseAnon } = require('../config');

// Helper para obter URL pública (usado para retornar o objeto GeneratedImage completo)
const getPublicUrl = (bucketName, path) => {
    const { data: { publicUrl } } = supabaseAnon.storage
        .from(bucketName)
        .getPublicUrl(path);
    return publicUrl;
};

// Rate Limiting for generation endpoint (user-based)
const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Muitas requisições de geração. Por favor, tente novamente após um minuto.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => req.user.id,
});

// Generate Image Endpoint (Inicia o trabalho)
router.post('/generate', authenticateToken, generationLimiter, async (req, res, next) => {
  const { promptInfo } = req.body;
  const user = req.user;

  if (!promptInfo || !promptInfo.companyName || !promptInfo.details) {
    return res.status(400).json({ error: "Nome da empresa e detalhes são obrigatórios." });
  }
  
  const MAX_LOGO_BASE64_LENGTH_SERVER = 40000;
  if (promptInfo.logo && promptInfo.logo.length > MAX_LOGO_BASE64_LENGTH_SERVER) {
    return res.status(400).json({ error: `O logo é muito grande. O tamanho máximo permitido é de ${Math.round(MAX_LOGO_BASE64_LENGTH_SERVER / 1.33 / 1024)}KB.` });
  }
  
  // 1. Quota Check and Increment (Falha Rápida)
  try {
      await checkAndIncrementQuota(user.id);
  } catch (quotaError) {
      // Se a quota for atingida, retorna 403
      return res.status(403).json({ 
          error: quotaError.message, 
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
          // CRITICAL FIX: Passando jobId e userId corretamente
          processImageGeneration(jobId, user.id, promptInfo); 
      }, 0); 

      // 4. Retorna 202 Accepted (Processando)
      res.status(202).json({ 
          message: 'Geração iniciada. Verifique o status em breve.', 
          jobId: jobId 
      });

  } catch (error) {
      console.error(`Erro ao registrar o trabalho de geração:`, error);
      res.status(500).json({ error: 'Falha ao registrar o pedido de geração.' });
  }
});

// Endpoint /api/job-status/:jobId (Verifica o status do trabalho)
router.get('/job-status/:jobId', authenticateToken, async (req, res) => {
    const { jobId } = req.params;
    const user = req.user;

    try {
        const { data, error } = await supabaseService
            .from('generation_jobs')
            .select('status, image_url, error_message')
            .eq('id', jobId)
            .eq('user_id', user.id) // Garante que o usuário só veja seus próprios jobs
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

// NOVO ENDPOINT: /api/history
router.get('/history', authenticateToken, async (req, res, next) => {
    const user = req.user;
    
    try {
        // CRITICAL FIX: Filtra explicitamente pelo user_id para evitar IDOR
        const { data, error } = await supabaseService
            .from('images')
            .select('*')
            .eq('user_id', user.id) 
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching user history:", error);
            throw new Error(error.message);
        }
        
        // Mapeia para o formato GeneratedImage e adiciona a URL pública
        const imagesWithUrls = data.map((row) => ({
            id: row.id,
            url: getPublicUrl('generated-arts', row.image_url),
            prompt: row.prompt,
            businessInfo: row.business_info,
            createdAt: new Date(row.created_at).getTime(),
        }));

        res.json(imagesWithUrls);
    } catch (error) {
        next(error);
    }
});

module.exports = router;