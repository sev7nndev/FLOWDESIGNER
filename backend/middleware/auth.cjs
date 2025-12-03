const { supabaseAnon, supabaseService } = require('../config');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token provided in auth header');
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  try {
    console.log('🔐 Verifying token...');
    
    // Use supabaseAnon to verify JWT token (standard practice)
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error) {
      console.error('❌ Token verification error:', error.message);
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    if (!user) {
      console.error('❌ No user found for token');
      return res.status(403).json({ error: 'Usuário não encontrado.' });
    }

    console.log('✅ Token verified for user:', user.id);

    // Get user profile using SERVICE ROLE client for reliable access
    try {
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError.message);
        
        // Se perfil não existe, criar um perfil padrão
        if (profileError.code === 'PGRST116') {
          console.log('📝 Creating default profile for user:', user.id);
          const { error: createError } = await supabaseService
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              role: 'free',
              status: 'on',
              first_name: '',
              last_name: ''
            })
            .single();

          if (createError) {
            console.error('❌ Error creating default profile:', createError.message);
            return res.status(500).json({ error: 'Erro ao criar perfil padrão.' });
          }

          console.log('✅ Default profile created');
          req.user = {
            ...user,
            profile: { role: 'free', status: 'on' }
          };
        } else {
          return res.status(500).json({ error: 'Erro ao buscar perfil do usuário.' });
        }
      } else {
        req.user = {
          ...user,
          profile: profile || { role: 'free', status: 'on' }
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