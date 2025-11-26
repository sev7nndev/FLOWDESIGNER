// ... (código anterior)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'client';

    // 1.5. Verificar Autorização/Role (Ajustado para suportar múltiplas roles pagantes)
    const AUTHORIZED_ROLES = ['admin', 'pro_user']; // Adicione 'pro_user' ou 'paid' aqui

    if (!AUTHORIZED_ROLES.includes(userRole)) {
      return res.status(403).json({ error: 'Acesso negado. A geração de arte está disponível apenas para usuários Pro.' });
    }

// ... (código restante)