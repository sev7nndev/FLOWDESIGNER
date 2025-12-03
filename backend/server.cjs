const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Tenta carregar o Mercado Pago. Se falhar, o erro será capturado aqui.
let mercadopago;
try {
    mercadopago = require('mercadopago');
} catch (e) {
    console.error("FATAL ERROR: Failed to load 'mercadopago'. Please run 'npm install'.", e);
    // Se o require falhar, o processo Node.js deve sair com erro 1, que é o que está acontecendo.
    // Se o require for bem-sucedido, mas a configuração falhar, o erro será capturado abaixo.
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuração de CORS Restrita ---
const ALLOWED_ORIGINS = [
  'http://localhost:3000', 
  'https://ai.studio', 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Reduzindo o limite de 50mb para 1mb, já que o logo é pequeno e o resto é texto.
app.use(express.json({ limit: '1mb' })); 
app.set('trust proxy', 1);

// --- Supabase Clients ---
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("WARNING: Supabase keys are missing. Backend routes requiring Service Role will fail.");
}

// Cria clientes Supabase, usando strings vazias se as chaves estiverem ausentes.
// O SDK do Supabase pode lançar um erro se a URL for vazia, mas a versão 2.x é mais tolerante.
const supabaseAnon = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const supabaseServiceRole = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
);

// --- Mercado Pago Configuration ---
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
if (MP_ACCESS_TOKEN && mercadopago) {
    mercadopago.configure({
        access_token: MP_ACCESS_TOKEN,
    });
    console.log("Mercado Pago configured successfully.");
} else {
    console.warn("WARNING: MERCADO_PAGO_ACCESS_TOKEN not found or mercadopago module failed to load. Payment routes will be mocked or fail.");
}

// --- Middleware de Autenticação e Autorização ---

// 1. Verifica o JWT e anexa o UID do usuário à requisição
const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        // Use o cliente anon para verificar o token
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
        }
        
        req.user = user;
        next();
    } catch (e) {
        console.error("JWT Verification Error:", e);
        return res.status(401).json({ error: 'Unauthorized: Token verification failed.' });
    }
};

// 2. Verifica se o usuário é Admin/Dev/Owner
const authorizeAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ error: 'Forbidden: Authentication required.' });
    }
    
    if (!SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Internal Server Error: Service Role Key is missing for authorization check.' });
    }
    
    try {
        const { data: profile, error } = await supabaseServiceRole
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();
            
        if (error || !profile) {
            return res.status(403).json({ error: 'Forbidden: Profile not found or access denied.' });
        }
        
        const allowedRoles = ['admin', 'dev', 'owner'];
        if (!allowedRoles.includes(profile.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
        }
        
        req.userRole = profile.role;
        next();
    } catch (e) {
        console.error("Admin Authorization Error:", e);
        return res.status(500).json({ error: 'Internal server error during authorization.' });
    }
};


// --- ROTAS DE GERAÇÃO E QUOTA (Requerem apenas verifyAuth) ---

// Rota de Geração de Imagem
app.post('/api/generate', verifyAuth, async (req, res) => {
    if (!SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Erro de configuração: Chave de Serviço Supabase ausente.' });
    }
    
    console.log(`User ${req.user.id} requested image generation.`);
    
    // Simulação de sucesso (retorna um objeto de imagem válido)
    const mockImage = {
        id: uuidv4(),
        user_id: req.user.id,
        prompt: "Placeholder prompt",
        image_url: `images/${req.user.id}/mock_image_${Date.now()}.png`,
        business_info: req.body.promptInfo,
        created_at: new Date().toISOString()
    };
    
    res.json({ 
        message: "Generation successful (mocked)",
        image: mockImage
    });
});

// Rota de Verificação de Quota
app.get('/api/check-quota', verifyAuth, async (req, res) => {
    if (!SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Erro de configuração: Chave de Serviço Supabase ausente.' });
    }
    
    console.log(`User ${req.user.id} checked quota.`);
    
    try {
        const { data: usageData, error: usageError } = await supabaseServiceRole
            .from('user_usage')
            .select('user_id, plan_id, current_usage, cycle_start_date')
            .eq('user_id', req.user.id)
            .single();
            
        if (usageError || !usageData) {
            const defaultUsage = { user_id: req.user.id, plan_id: 'free', current_usage: 0, cycle_start_date: new Date().toISOString() };
            const { data: planSettings, error: planError } = await supabaseServiceRole
                .from('plan_settings')
                .select('id, max_images_per_month, price')
                .eq('id', 'free')
                .single();
                
            if (planError || !planSettings) throw new Error("Plan settings not found.");
            
            const { data: allPlans, error: allPlansError } = await supabaseServiceRole
                .from('plan_details')
                .select('*, plan_settings(price, max_images_per_month)');
                
            if (allPlansError) throw new Error("Failed to fetch all plans.");
            
            const plans = allPlans.map(p => ({
                id: p.id,
                display_name: p.display_name,
                description: p.description,
                features: p.features,
                price: p.plan_settings.price,
                max_images_per_month: p.plan_settings.max_images_per_month
            }));
            
            return res.json({
                status: 'ALLOWED',
                usage: defaultUsage,
                plan: planSettings,
                plans: plans,
                message: "Quota check successful (default free plan)."
            });
        }
        
        const { data: planSettings, error: planError } = await supabaseServiceRole
            .from('plan_settings')
            .select('id, max_images_per_month, price')
            .eq('id', usageData.plan_id)
            .single();
            
        if (planError || !planSettings) throw new Error("Plan settings not found.");
        
        const maxImages = planSettings.max_images_per_month;
        let status = 'ALLOWED';
        let message = "Quota OK.";
        
        if (usageData.current_usage >= maxImages) {
            status = 'BLOCKED';
            message = "Limite de geração atingido.";
        } else if (usageData.current_usage / maxImages > 0.8) {
            status = 'NEAR_LIMIT';
            message = "Você está perto do limite de gerações.";
        }
        
        const { data: allPlans, error: allPlansError } = await supabaseServiceRole
            .from('plan_details')
            .select('*, plan_settings(price, max_images_per_month)');
            
        if (allPlansError) throw new Error("Failed to fetch all plans.");
        
        const plans = allPlans.map(p => ({
            id: p.id,
            display_name: p.display_name,
            description: p.description,
            features: p.features,
            price: p.plan_settings.price,
            max_images_per_month: p.plan_settings.max_images_per_month
        }));

        res.json({
            status: status,
            usage: usageData,
            plan: planSettings,
            plans: plans,
            message: message
        });
        
    } catch (e) {
        console.error("Quota check failed:", e);
        res.status(500).json({ error: e.message || 'Internal server error during quota check.' });
    }
});

// Rota de Iniciação de Assinatura (Mercado Pago)
app.post('/api/subscribe', verifyAuth, async (req, res) => {
    const { planId } = req.body;
    
    if (!mercadopago) {
        return res.status(500).json({ error: "Erro de configuração: Módulo Mercado Pago não carregado." });
    }
    
    if (!MP_ACCESS_TOKEN) {
        return res.status(500).json({ error: "Erro de configuração: Token do Mercado Pago não está definido no servidor." });
    }
    
    if (!SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Erro de configuração: Chave de Serviço Supabase ausente.' });
    }
    
    console.log(`User ${req.user.id} initiating subscription for plan ${planId}`);
    
    const { data: planSettings, error } = await supabaseServiceRole
        .from('plan_settings')
        .select('price')
        .eq('id', planId)
        .single();
        
    if (error || !planSettings) {
        return res.status(400).json({ error: "Plano inválido ou não encontrado." });
    }
    
    const price = planSettings.price;
    
    const preference = {
        items: [{
            title: `Assinatura Flow Designer - ${planId.toUpperCase()}`,
            unit_price: parseFloat(price),
            quantity: 1,
        }],
        back_urls: {
            success: `${process.env.FRONTEND_URL}/checkout/success?plan=${planId}`,
            failure: `${process.env.FRONTEND_URL}/checkout/failure?plan=${planId}`,
            pending: `${process.env.FRONTEND_URL}/checkout/pending?plan=${planId}`,
        },
        auto_return: "approved",
        external_reference: `${req.user.id}_${planId}_${Date.now()}`,
        payer: {
            email: req.user.email,
        }
    };
    
    // NOTE: A chamada real ao MP deve ser feita aqui:
    // const mpResponse = await mercadopago.preferences.create(preference);
    // const paymentUrl = mpResponse.body.init_point;
    
    // Mock URL
    const paymentUrl = `https://mock-mercadopago.com/payment?plan=${planId}&price=${price}`;

    res.json({ paymentUrl });
});


// --- ROTAS DE ADMINISTRAÇÃO (Requerem verifyAuth E authorizeAdmin) ---

// Rota Admin: Listar todas as imagens (Service Role required)
app.get('/api/admin/images', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Erro de configuração: Chave de Serviço Supabase ausente.' });
    }
    
    console.log(`Admin ${req.user.id} fetching all images.`);
    
    try {
        const { data, error } = await supabaseServiceRole
            .from('images')
            .select('id, user_id, prompt, image_url, business_info, created_at')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        res.json({ images: data });
    } catch (e) {
        console.error("Admin fetch all images failed:", e);
        res.status(500).json({ error: 'Failed to fetch all images.' });
    }
});

// Rota Admin: Deletar imagem (Service Role required)
app.delete('/api/admin/images/:imageId', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Erro de configuração: Chave de Serviço Supabase ausente.' });
    }
    
    const { imageId } = req.params;
    const { imageUrl } = req.body;
    
    console.log(`Admin ${req.user.id} deleting image ${imageId} at path ${imageUrl}.`);
    
    try {
        const { error: storageError } = await supabaseServiceRole.storage
            .from('images')
            .remove([imageUrl]);
            
        if (storageError && storageError.message !== 'The resource was not found') {
            console.warn("Storage deletion warning:", storageError.message);
        }
        
        const { error: dbError } = await supabaseServiceRole
            .from('images')
            .delete()
            .eq('id', imageId);
            
        if (dbError) throw dbError;
        
        res.status(200).json({ message: 'Image deleted successfully.' });
    } catch (e) {
        console.error("Admin delete image failed:", e);
        res.status(500).json({ error: 'Failed to delete image.' });
    }
});

// Rota Admin: Upload de imagem da Landing Page (Service Role required)
app.post('/api/admin/landing-images/upload', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Erro de configuração: Chave de Serviço Supabase ausente.' });
    }
    
    const { fileBase64, fileName, userId } = req.body;
    
    if (!fileBase64 || !fileName) {
        return res.status(400).json({ error: "Missing file data." });
    }
    
    const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const fileExtension = fileName.split('.').pop();
    const storagePath = `landing-carousel/${uuidv4()}.${fileExtension}`;
    
    try {
        const { error: uploadError } = await supabaseServiceRole.storage
            .from('landing-carousel')
            .upload(storagePath, buffer, {
                contentType: `image/${fileExtension}`,
                upsert: false,
            });
            
        if (uploadError) throw uploadError;
        
        const { data: insertedImage, error: dbError } = await supabaseServiceRole
            .from('landing_carousel_images')
            .insert({
                image_url: storagePath,
                created_by: userId,
                sort_order: 0
            })
            .select('id, image_url, sort_order')
            .single();
            
        if (dbError) throw dbError;
        
        const { data: { publicUrl } } = supabaseAnon.storage
            .from('landing-carousel')
            .getPublicUrl(insertedImage.image_url);
            
        res.json({ 
            message: 'Upload successful',
            image: {
                id: insertedImage.id,
                url: publicUrl,
                sortOrder: insertedImage.sort_order
            }
        });
        
    } catch (e) {
        console.error("Admin landing image upload failed:", e);
        res.status(500).json({ error: e.message || 'Failed to upload landing image.' });
    }
});

// Rota Admin: Deletar imagem da Landing Page (Service Role required)
app.delete('/api/admin/landing-images/:id', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Erro de configuração: Chave de Serviço Supabase ausente.' });
    }
    
    const { id } = req.params;
    const { imagePath } = req.body;
    
    console.log(`Admin ${req.user.id} deleting landing image ${id} at path ${imagePath}.`);
    
    try {
        const { error: storageError } = await supabaseServiceRole.storage
            .from('landing-carousel')
            .remove([imagePath]);
            
        if (storageError && storageError.message !== 'The resource was not found') {
            console.warn("Storage deletion warning:", storageError.message);
        }
        
        const { error: dbError } = await supabaseServiceRole
            .from('landing_carousel_images')
            .delete()
            .eq('id', id);
            
        if (dbError) throw dbError;
        
        res.status(200).json({ message: 'Landing image deleted successfully.' });
    } catch (e) {
        console.error("Admin delete landing image failed:", e);
        res.status(500).json({ error: 'Failed to delete landing image.' });
    }
});

// Rota Admin: Obter URL de Conexão Mercado Pago (Service Role required)
app.get('/api/admin/mp-connect', verifyAuth, authorizeAdmin, async (req, res) => {
    if (!process.env.MERCADO_PAGO_CLIENT_ID || !process.env.FRONTEND_URL) {
        return res.status(500).json({ error: "Erro de configuração: MERCADO_PAGO_CLIENT_ID ou FRONTEND_URL não definidos." });
    }
    
    const redirectUri = process.env.FRONTEND_URL + '/dev-panel'; 
    
    const connectUrl = `https://auth.mercadopago.com/oauth/authorize?client_id=${process.env.MERCADO_PAGO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
    
    res.json({ connectUrl });
});


// --- Rota de Health Check ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'Flow Designer Backend' });
});

// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`Flow Designer Backend running on port ${PORT}`);
});