// backend/middleware/roleMiddleware.cjs
const { supabaseService } = require('../config');

const roleMiddleware = (allowedRoles) => {
    return async (req, res, next) => {
        const userId = req.user.id; // Assumindo que o authMiddleware já rodou

        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        try {
            const { data: profile, error } = await supabaseService
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error || !profile) {
                return res.status(404).json({ error: 'Perfil do usuário não encontrado.' });
            }

            if (allowedRoles.includes(profile.role)) {
                next(); // O usuário tem a role permitida
            } else {
                res.status(403).json({ error: 'Acesso negado. Permissões insuficientes.' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Erro ao verificar as permissões do usuário.' });
        }
    };
};

module.exports = {
    roleMiddleware,
};