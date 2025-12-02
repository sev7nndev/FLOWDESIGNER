const checkAdminOrDev = async (req, res, next) => {
  const user = req.user;
  
  if (!user || !user.profile) {
    return res.status(401).json({ error: 'Não autenticado ou perfil não carregado.' });
  }

  const { role } = user.profile;
  
  if (!['admin', 'dev', 'owner'].includes(role)) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores e desenvolvedores podem acessar.' });
  }

  next();
};

module.exports = { checkAdminOrDev };