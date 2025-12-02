// backend/middleware/authMiddleware.cjs
const { supabaseAnon } = require('../config'); // Usamos o cliente anônimo para verificar o token

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    try {
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

        if (error || !user) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }

        req.user = user; // Anexa o objeto do usuário à requisição
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno ao validar o token.' });
    }
};

module.exports = {
    authMiddleware,
};