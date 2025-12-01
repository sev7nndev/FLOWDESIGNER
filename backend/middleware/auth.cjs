const { supabaseAnon, supabaseService } = require('../config');

// Helper function to verify JWT token and fetch user role
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  try {
    // 1. Use supabaseAnon to verify the token and get the user
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      console.error("JWT verification failed:", error?.message || "User not found");
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    // 2. Fetch user role and credits from profiles table using the Service Key (supabaseService)
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('role, credits')
      .eq('id', user.id)
      .single();
      
    const role = profile?.role || 'free'; // Default to 'free' if profile not found
    const credits = profile?.credits || 0;

    if (profileError && profileError.code !== 'PGRST116') {
        console.warn(`Error fetching profile role/credits for user ${user.id}:`, profileError.message);
    }

    // 3. Attach user info, role, and credits to request object
    req.user = { id: user.id, email: user.email, token: token, role: role, credits: credits };
    next();
  } catch (e) {
    console.error("Error during token authentication:", e.message);
    return res.status(500).json({ error: 'Erro interno do servidor ao autenticar token.' });
  }
};

module.exports = {
  authenticateToken,
};