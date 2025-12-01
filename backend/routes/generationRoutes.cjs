const express = require('express');
const router = express.Router();
const { supabaseService } = require('../config');
const { authenticateToken } = require('../middleware/auth'); // Importando o middleware

// Aplica autenticação a todas as rotas de geração
router.use(authenticateToken);

// Rota para gerar um fluxo de design
router.post('/flow', async (req, res) => {
    const { businessInfo, logoBase64 } = req.body;
    const userId = req.user.id; 
    const currentCredits = req.user.credits;
    
    if (!businessInfo) {
        return res.status(400).json({ error: 'A descrição do negócio é obrigatória.' });
    }

    // 1. Verificação de Créditos
    if (currentCredits <= 0) {
        return res.status(403).json({ error: 'Você está sem créditos. Faça um upgrade para continuar gerando.' });
    }

    console.log(`[BACKEND] Recebida solicitação de geração para user ${userId}. Créditos: ${currentCredits}`);
    
    // 2. Simulação de Geração (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Dedução de Créditos e Registro da Geração (Transacional)
    try {
        // Dedução de 1 crédito
        const { error: creditError } = await supabaseService
            .from('profiles')
            .update({ credits: currentCredits - 1 })
            .eq('id', userId);

        if (creditError) {
            console.error(`Failed to deduct credit for user ${userId}:`, creditError);
            // Se a dedução falhar, ainda retornamos a imagem, mas logamos o erro crítico.
            // Em um sistema real, isso exigiria transações mais complexas ou rollbacks.
        }
        
        // Simulação de inserção na tabela 'generations' (assumindo que a tabela existe)
        const mockGenerationRecord = {
            user_id: userId,
            prompt: businessInfo,
            url: 'https://via.placeholder.com/800x450?text=Generated+Flow+Design+Backend+Mock',
            negative_prompt: 'low quality, blurry',
            style: 'flowchart',
            aspect_ratio: '16:9',
        };
        
        // NOTE: Não vamos inserir no DB agora, pois a tabela 'generations' não está definida no schema.
        // Apenas simulamos o sucesso da geração.

    } catch (e) {
        console.error('Error during credit deduction/generation simulation:', e);
        return res.status(500).json({ error: 'Erro interno ao processar a geração.' });
    }

    // 4. Resposta de Sucesso
    const mockImage = {
        id: Date.now().toString(),
        url: 'https://via.placeholder.com/800x450?text=Generated+Flow+Design+Backend+Success',
        prompt: businessInfo,
        negativePrompt: 'low quality, blurry',
        style: 'flowchart',
        aspectRatio: '16:9',
        createdAt: Date.now(),
        userId: userId,
    };
    
    res.status(200).json(mockImage);
});

module.exports = router;