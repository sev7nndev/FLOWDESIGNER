// backend/index.cjs
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { supabaseService } = require('./config');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const { processSubscriptionUpdate } = require('./services/webhookService'); // Importando o novo serviço

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de CORS
const corsOptions = {
    origin: 'http://localhost:5173', // Permitir apenas o frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middleware para rotas públicas (sem autenticação)
app.use('/api/public', publicRoutes);

// Middleware para rotas de webhook (deve ser raw body para Stripe, mas usaremos JSON simples aqui)
app.post('/api/public/webhook/subscription-update', bodyParser.json(), async (req, res) => {
    try {
        // Simula o processamento do evento de webhook
        const event = req.body;
        console.log(`[WEBHOOK] Recebido evento de assinatura para user: ${event.userId}`);
        
        await processSubscriptionUpdate(event);
        
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('[WEBHOOK ERROR]:', error);
        res.status(500).json({ error: 'Falha ao processar webhook.' });
    }
});

// Middleware para rotas que requerem autenticação (JSON parsing)
app.use(bodyParser.json());

// Rotas Autenticadas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);

// Rota de teste
app.get('/', (req, res) => {
    res.send('Flow Designer Backend is running.');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});