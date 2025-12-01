const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar módulos modularizados
const { supabaseAnon } = require('./config');
const { authenticateToken } = require('./middleware/auth');
const generationRoutes = require('./routes/generationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://ai.studio'],
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.set('trust proxy', 1);

// --- Rotas ---

// Rotas de Geração (Quota, Status, Geração)
app.use('/api', generationRoutes);

// Rotas Administrativas (Protegidas por checkAdminOrDev dentro do módulo)
app.use('/api/admin', adminRoutes);

// Endpoint para buscar histórico (mantido aqui, mas simplificado)
app.get('/api/history', authenticateToken, async (req, res, next) => {
    const user = req.user;
    try {
        const { data, error } = await supabaseAnon
            .from('images')
            .select('id, prompt, business_info, created_at, image_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Mapeia para o formato GeneratedImage e adiciona a URL pública
        const historyWithUrls = data.map((row) => {
            const { data: { publicUrl } } = supabaseAnon.storage
                .from('generated-arts')
                .getPublicUrl(row.image_url);
                
            return {
                id: row.id,
                url: publicUrl,
                prompt: row.prompt,
                businessInfo: row.business_info,
                createdAt: new Date(row.created_at).getTime()
            };
        });

        res.json(historyWithUrls);
    } catch (error) {
        next(error);
    }
});

// Endpoint para buscar imagens da landing page (mantido aqui, mas simplificado)
app.get('/api/landing-images', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAnon
            .from('landing_carousel_images')
            .select('id, image_url, sort_order')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        const imagesWithUrls = data.map(row => {
            const { data: { publicUrl } } = supabaseAnon.storage
                .from('landing-carousel')
                .getPublicUrl(row.image_url);
                
            return {
                id: row.id,
                url: publicUrl,
                sortOrder: row.sort_order
            };
        });

        res.json(imagesWithUrls);
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