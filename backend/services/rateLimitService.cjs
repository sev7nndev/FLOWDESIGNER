const rateLimit = require('express-rate-limit');

/**
 * Advanced Rate Limiting Configuration
 * Protects API endpoints from abuse
 */

// General API rate limit (100 requests per 15 minutes)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limit for AI generation (prevents abuse of expensive API)
const generationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 generations per minute max
    message: { error: 'Limite de gerações atingido. Aguarde 1 minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
    // Custom key generator to rate limit by user ID if authenticated
    keyGenerator: (req) => {
        // If user is authenticated, use their ID
        if (req.user && req.user.id) {
            return `user_${req.user.id}`;
        }
        // Otherwise use IP
        return req.ip;
    }
});

// Auth endpoints (login/register) - prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Payment endpoints - extra strict
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 payment attempts per hour
    message: { error: 'Limite de tentativas de pagamento atingido.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    generationLimiter,
    authLimiter,
    paymentLimiter
};
