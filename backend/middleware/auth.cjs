const { supabaseAnon } = require('../config');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token provided in auth header');
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  try {
    console.log('🔐 Verifying token...');
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error) {
      console.error('❌ Token verification error:', error.message);
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    if (!user) {
      console.error('❌ No user found for token');
      return res.status(403).json({ error: 'Usuário não encontrado.' });
    }

    // Get user profile
    try {
      const { data: profile, error: profileError } = await supabaseAnon
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('❌ Profile fetch error:', profileError.message);
        // Se o perfil não for encontrado, ainda podemos prosseguir, mas sem a role
        req.user = { ...user, profile: { role: 'free' } };
      } else {
        req.user = {
          ...user,
          profile: profile || { role: 'free' } // Garante que profile não seja null
        };
      }
      
      console.log('✅ Auth successful for user:', user.id, 'Role:', req.user.profile.role);
      next();
    } catch (profileError) {
      console.error('❌ Profile fetch error:', profileError.message);
      return res.status(500).json({ error: 'Erro interno na autenticação.' });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(500).json({ error: 'Erro interno ao validar o token.' });
  }
};

module.exports = {
  authenticateToken
};