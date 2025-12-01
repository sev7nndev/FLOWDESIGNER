// backend/middleware/auth.cjs
const { supabaseService } = require('../config');

// Middleware to verify the JWT token from the Authorization header
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Authentication token required.' });
    }

    try {
        // 1. Verify the token using the Supabase service client
        const { data: { user }, error } = await supabaseService.auth.getUser(token);

        if (error || !user) {
            console.error('JWT verification failed:', error?.message);
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        // Attach user info to the request object
        req.user = user;

        // 2. Fetch user role from the 'profiles' table
        const { data: profileData, error: profileError } = await supabaseService
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Failed to fetch user role:', profileError?.message);
            req.user.role = 'free'; // Default to lowest role on error
        } else if (profileData) {
            req.user.role = profileData.role;
        } else {
            req.user.role = 'free'; // Default if profile not found
        }

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ error: 'Internal server authentication error.' });
    }
};

// Removed checkRole middleware as it's not used in the generation flow anymore.

module.exports = {
    authenticateToken,
};