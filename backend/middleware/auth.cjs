const { supabaseAnon, supabaseServiceRole } = require('../config.cjs');

// 1. Verifica o JWT e anexa o UID do usuário à requisição
const verifyAuth = async (req, res, next) => {
    if (!supabaseAnon) {
        return res.status(401).json({ error: 'Unauthorized: Supabase configuration missing on backend.' });
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
        }
        
        req.user = user;
        req.user.token = token; // Store token for internal API calls if needed
        next();
    } catch (e) {
        console.error("JWT Verification Error:", e);
        return res.status(401).json({ error: 'Unauthorized: Token verification failed.' });
    }
};

// 2. Verifica se o usuário é Admin/Dev/Owner
const authorizeAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ error: 'Forbidden: Authentication required.' });
    }
    
    if (!supabaseServiceRole) {
        return res.status(403).json({ error: 'Forbidden: Supabase Service Role configuration missing on backend.' });
    }
    
    try {
        const { data: profile, error } = await supabaseServiceRole
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();
            
        if (error || !profile) {
            return res.status(403).json({ error: 'Forbidden: Profile not found or access denied.' });
        }
        
        const allowedRoles = ['admin', 'dev', 'owner'];
        if (!allowedRoles.includes(profile.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
        }
        
        req.userRole = profile.role;
        next();
    } catch (e) {
        console.error("Admin Authorization Error:", e);
        return res.status(500).json({ error: 'Internal server error during authorization.' });
    }
};

module.exports = {
    verifyAuth,
    authorizeAdmin,
};