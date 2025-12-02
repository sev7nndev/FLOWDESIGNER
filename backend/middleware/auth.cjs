const { supabaseAnon } = require('../config');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error) {
      console.error('Auth middleware error:', error);
      return res.status(403).json({ error: 'Token inválido.' });
    }

    if (!user) {
      return res.status(403).json({ error: 'Usuário não encontrado.' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(403).json({ error: 'Perfil do usuário não encontrado.' });
    }

    req.user = {
      ...user,
      profile: profile
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Erro interno na autenticação.' });
  }
};

module.exports = {
  authenticateToken
};