// backend/routes/planRoutes.cjs
const express = require('express');
const router = express.Router();
const planService = require('../services/planService');

// Rota para buscar todos os planos ativos
router.get('/', async (req, res) => {
    try {
        const plans = await planService.getActivePlans();
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;