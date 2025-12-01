const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Aplica autenticação
router.use(authenticateToken);

// Rota para buscar o histórico de gerações do usuário autenticado
router.get('/', async (req, res) => {
    const userId = req.user.id;
    
    // Em um sistema real, você faria uma consulta ao Supabase:
    // const { data, error } = await supabaseService.from('generations').select('*').eq('user_id', userId).order('created_at', { ascending: false });

    // MOCK: Simula o retorno de 3 itens de histórico
    const mockHistory = [
        {
            id: 'hist-1',
            url: 'https://via.placeholder.com/400x225?text=History+Item+1',
            prompt: 'Fluxo de onboarding de usuário com integração Stripe.',
            negativePrompt: 'low quality',
            style: 'minimalist',
            aspectRatio: '16:9',
            createdAt: Date.now() - 86400000, // 1 day ago
            userId: userId,
        },
        {
            id: 'hist-2',
            url: 'https://via.placeholder.com/400x225?text=History+Item+2',
            prompt: 'Diagrama de arquitetura de microserviços.',
            negativePrompt: 'blurry',
            style: 'tech',
            aspectRatio: '16:9',
            createdAt: Date.now() - 172800000, // 2 days ago
            userId: userId,
        },
        {
            id: 'hist-3',
            url: 'https://via.placeholder.com/400x225?text=History+Item+3',
            prompt: 'Fluxo de recuperação de senha complexo.',
            negativePrompt: 'bad colors',
            style: 'flowchart',
            aspectRatio: '16:9',
            createdAt: Date.now() - 259200000, // 3 days ago
            userId: userId,
        },
    ];

    res.status(200).json(mockHistory);
});

module.exports = router;