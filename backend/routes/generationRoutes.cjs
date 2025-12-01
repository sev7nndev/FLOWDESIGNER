const express = require('express');
const router = express.Router();
const { supabaseService } = require('../config'); // Assuming config exports supabaseService

// MOCK: Simula a geração de um fluxo de design
router.post('/flow', async (req, res) => {
    const { businessInfo, logoBase64 } = req.body;
    
    // Simulação de autenticação e verificação de créditos (a ser implementada)
    // const userId = req.user.id; 

    if (!businessInfo) {
        return res.status(400).json({ error: 'A descrição do negócio é obrigatória.' });
    }

    console.log(`[BACKEND] Recebida solicitação de geração para: ${businessInfo.substring(0, 50)}...`);
    
    // Simula um atraso de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simula a resposta de sucesso
    const mockImage = {
        id: Date.now().toString(),
        url: 'https://via.placeholder.com/800x450?text=Generated+Flow+Design+Backend+Mock',
        prompt: businessInfo,
        negativePrompt: 'low quality, blurry',
        style: 'flowchart',
        aspectRatio: '16:9',
        createdAt: Date.now(),
        userId: 'mock-user-id',
    };

    // Em um ambiente real, aqui você chamaria o serviço de IA e registraria o uso.
    
    res.status(200).json(mockImage);
});

module.exports = router;