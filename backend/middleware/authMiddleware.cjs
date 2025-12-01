const { supabaseAnon, supabaseService } = require('../config.cjs');

// Helper function to verify JWT token and attach user info
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  try {
    // Use supabaseAnon to verify the token and get the user
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      console.error("JWT verification failed:", error?.message || "User not found");
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    req.user = { id: user.id, email: user.email, token: token };
    next();
  } catch (e) {
    console.error("Error during token authentication:", e.message);
    return res.status(500).json({ error: 'Erro interno do servidor ao autenticar token.' });
  }
};

/**
 * Middleware for Role-Based Access Control (RBAC).
 * Ensures the user is authenticated and has one of the allowed roles.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route.
 */
const protect = (allowedRoles) => {
    return [
        authenticateToken, // First, ensure the user is authenticated
        async (req, res, next) => {
            const user = req.user;
            if (!user) {
                // Should not happen if authenticateToken runs first, but for safety
                return res.status(401).json({ error: 'Não autenticado.' });
            }

            try {
                const { data: profile, error } = await supabaseService
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const userRole = profile?.role;

                if (error || !userRole || !allowedRoles.includes(userRole)) {
                    return res.status(403).json({ error: 'Acesso negado. Você não tem a permissão necessária.' });
                }
                next();
            } catch (e) {
                console.error("Error checking user role:", e.message);
                return res.status(500).json({ error: 'Erro interno do servidor ao verificar permissões.' });
            }
        }
    ];
};

module.exports = {
  authenticateToken,
  protect,
};