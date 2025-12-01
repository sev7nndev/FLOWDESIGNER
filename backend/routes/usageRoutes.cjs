const express = require('express');
const router = express.Router();
const { supabaseService, PRO_LIMIT, STARTER_LIMIT, FREE_LIMIT } = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Aplica autenticação a todas as rotas de uso
router.use(authenticateToken);

// Rota para buscar dados de uso do usuário autenticado
router.get('/', async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const currentCredits = req.user.credits;

    // 1. Determinar o limite mensal com base no papel
    let maxMonthlyGenerations = 0;
    switch (userRole) {
        case 'owner':
        case 'admin':
        case 'dev':
            maxMonthlyGenerations = 9999; // Ilimitado para admins/devs
            break;
        case 'pro':
            maxMonthlyGenerations = PRO_LIMIT;
            break;
        case 'starter':
            maxMonthlyGenerations = STARTER_LIMIT;
            break;
        case 'free':
        default:
            maxMonthlyGenerations = FREE_LIMIT;
            break;
    }

    // 2. Contar gerações deste mês (MOCK/Placeholder)
    // Em um sistema real, você faria uma consulta ao Supabase para contar as gerações
    // na tabela 'generations' onde user_id = userId e created_at está no mês atual.
    
    // MOCK: Simula a contagem de gerações
    const generationsThisMonth = 2; 
    const totalGenerations = 50; // MOCK

    const usageData = {
        totalGenerations: totalGenerations,
        monthlyGenerations: generationsThisMonth,
        maxMonthlyGenerations: maxMonthlyGenerations,
        credits: currentCredits,
        generationsThisMonth: generationsThisMonth,
    };

    res.status(200).json(usageData);
});

module.exports = router;