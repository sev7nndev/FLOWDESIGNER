// backend/server.cjs
const express = require('express');
const cors = require('cors');
const { supabaseAnon } = require('./config'); // Import the anonymous client
const generationRoutes = require('./routes/generationRoutes'); // Import the new routes

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow requests from the frontend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// --- Public Routes (e.g., Health Check) ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'AI Art Generator Backend is running.' });
});

// --- API Routes ---
// Use the modularized generation routes
app.use('/api/generation', generationRoutes);

// --- Quota/Usage Endpoint (Public, but requires user ID/token for data retrieval) ---
app.get('/api/usage/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // 1. Get Role from profiles
        const { data: profileData, error: profileError } = await supabaseAnon
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
            
        const role = profileData?.role || 'free';

        // 2. Get Usage Count from user_usage
        const { data: usageData, error: usageError } = await supabaseAnon
            .from('user_usage')
            .select('current_usage')
            .eq('user_id', userId)
            .single();
            
        const current_usage = usageData?.current_usage || 0;

        // Define limits based on role (must match backend/services/generationService.cjs)
        let limit = 0;
        let isUnlimited = false;

        switch (role) {
            case 'owner':
            case 'dev':
            case 'admin':
                isUnlimited = true;
                break;
            case 'pro':
                limit = 50; 
                break;
            case 'starter':
                limit = 20;
                break;
            case 'free':
            default:
                limit = 5;
                break;
        }

        res.status(200).json({
            role,
            current: current_usage,
            limit,
            isUnlimited,
        });

    } catch (error) {
        // If any error occurs (e.g., user not found in profiles/usage), return default free plan
        console.error('Error fetching usage data:', error);
        res.status(200).json({
            role: 'free',
            current: 0,
            limit: 5,
            isUnlimited: false,
        });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});