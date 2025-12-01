// backend/routes/generationRoutes.cjs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { processImageGeneration, checkAndIncrementQuota, getJobStatus } = require('../services/generationService');

// POST route to initiate image generation
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const { businessInfo } = req.body;
        const userId = req.user.id; // From the authenticated user object

        // 1. Quota Check and increment (This throws an error if quota is reached)
        // NOTE: Quota check is done before starting the job to fail fast.
        await checkAndIncrementQuota(userId);

        // 2. Start image generation (returns job ID)
        const { jobId, status } = await processImageGeneration(userId, businessInfo);

        res.status(202).json({ jobId, status }); // Return the job ID
    } catch (error) {
        console.error('Generate image route error:', error);
        // Check for specific quota error message
        if (error.message.includes('Quota Reached')) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// GET route to check generation status (for client polling)
router.get('/status/:jobId', authenticateToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        // We rely on RLS/security in the service layer, but the token ensures the user is logged in.

        const jobDetails = await getJobStatus(jobId);

        if (jobDetails.status === 'FAILED') {
            return res.status(200).json({
                status: 'FAILED',
                error: jobDetails.error_message || 'Generation failed.',
            });
        }

        if (jobDetails.status === 'COMPLETE' && jobDetails.image_path) {
            // Generate the public URL for the client
            const { data } = require('../config').supabaseService.storage
                .from('generated-arts')
                .getPublicUrl(jobDetails.image_path);

            res.status(200).json({
                status: 'COMPLETE',
                imageUrl: data.publicUrl,
            });
        } else {
            res.status(200).json({
                status: jobDetails.status,
            });
        }
    } catch (error) {
        console.error('Job status route error:', error);
        res.status(404).json({ error: error.message || 'Job not found.' });
    }
});

module.exports = router;