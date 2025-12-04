const crypto = require('crypto');

/**
 * Mercado Pago Webhook Signature Validation
 * Ensures webhooks are actually from Mercado Pago
 * Docs: https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
 */

/**
 * Validate Mercado Pago webhook signature
 * @param {Object} req - Express request object
 * @returns {boolean} - True if signature is valid
 */
function validateMercadoPagoSignature(req) {
    const secret = process.env.MP_WEBHOOK_SECRET;

    if (!secret || secret === 'YOUR_WEBHOOK_SECRET_HERE') {
        console.warn('⚠️ MP_WEBHOOK_SECRET not configured. Skipping signature validation.');
        return true; // Allow in development, but log warning
    }

    try {
        // Mercado Pago sends signature in x-signature header
        const signature = req.headers['x-signature'];
        const requestId = req.headers['x-request-id'];

        if (!signature || !requestId) {
            console.error('❌ Missing signature headers');
            return false;
        }

        // Extract ts and v1 from signature
        // Format: "ts=1234567890,v1=hash"
        const parts = {};
        signature.split(',').forEach(part => {
            const [key, value] = part.split('=');
            parts[key] = value;
        });

        const ts = parts.ts;
        const hash = parts.v1;

        if (!ts || !hash) {
            console.error('❌ Invalid signature format');
            return false;
        }

        // Get the data ID from query or body
        const dataId = req.query.id || req.body?.data?.id || '';

        // Construct the manifest (what Mercado Pago signs)
        const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

        // Generate HMAC
        const hmac = crypto
            .createHmac('sha256', secret)
            .update(manifest)
            .digest('hex');

        // Compare
        const isValid = hmac === hash;

        if (!isValid) {
            console.error('❌ Webhook signature validation failed');
            console.error('Expected:', hmac);
            console.error('Received:', hash);
        } else {
            console.log('✅ Webhook signature validated');
        }

        return isValid;
    } catch (error) {
        console.error('❌ Signature validation error:', error);
        return false;
    }
}

/**
 * Express middleware for webhook validation
 */
function webhookValidationMiddleware(req, res, next) {
    if (!validateMercadoPagoSignature(req)) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    next();
}

module.exports = {
    validateMercadoPagoSignature,
    webhookValidationMiddleware
};
