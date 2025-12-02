const { supabaseService } = require('../config');

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

    if (error || !profile) {
      return res.status(404).json({ error: 'Perfil não encontrado.' });
    }

    if (!['admin', 'dev', 'owner'].includes(profile.role)) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores e desenvolvedores podem acessar.' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin/dev role:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões.' });
  }
};

module.exports = { checkAdminOrDev };