// backend/middleware/auth.cjs
const { supabaseAnon, supabaseService } = require('../config');

// Helper function to verify JWT token using supabaseAnon (client-side key)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

    // Attach user object to request for use in routes
    req.user = {
      id: user.id,
      email: user.email,
      token: token // Optional: if you need the raw token later
    };
    next();
  } catch (e) {
    console.error("Error during token authentication:", e.message);
    return res.status(500).json({ error: 'Erro interno do servidor ao autenticar token.' });
  }
};

// Helper function to check if user has admin or dev role using supabaseService (service key)
const checkAdminOrDev = async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  try {
    const { data: profile, error } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile || !['admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores e desenvolvedores podem realizar esta ação.' });
    }
    next();
  } catch (e) {
    console.error("Error checking admin/dev role:", e.message);
    return res.status(500).json({ error: 'Erro interno do servidor ao verificar permissões.' });
  }
};

module.exports = {
  authenticateToken,
  checkAdminOrDev,
};