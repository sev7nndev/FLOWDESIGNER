import { supabase } from './supabaseClient';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<void> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Login falhou. Usuário não encontrado.');
      }

      if (!data.user.email_confirmed_at && data.user.email) {
        console.warn('Email não confirmado, mas permitindo acesso para desenvolvimento');
      }

      console.log('Login successful:', data.user.id);
    } catch (error: any) {
      console.error('AuthService login error:', error);
      throw new Error(error.message || 'Falha no login. Verifique suas credenciais.');
    }
  },

  async register(firstName: string, lastName: string, email: string, password: string, planId?: string): Promise<void> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Registro falhou. Tente novamente.');
      }

      const newUserId = data.user.id;
      const role = planId || 'free'; // O planId é o nome do plano em minúsculas ('starter', 'pro', ou 'free')

      // 1. Atualiza a role no perfil do usuário
      // O trigger 'handle_new_user' já criou o perfil, mas precisamos garantir a role correta
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: role })
        .eq('id', newUserId);

      if (profileError) {
        console.error('Profile role update error:', profileError);
        // Não lançar erro, pois o usuário já foi criado na autenticação
      }

      // 2. Se for um plano pago, cria/atualiza a assinatura
      if (planId && planId !== 'free') {
        // Busca o ID do plano na tabela 'plans'
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('id')
          .ilike('name', planId)
          .single();

        if (planError || !planData) {
          console.error(`Plano '${planId}' não encontrado para criar a assinatura.`);
        } else {
          // Cria ou atualiza a assinatura para 'active'
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: newUserId,
              plan_id: planData.id,
              status: 'active',
              // Definir períodos de ciclo (simplificado para 'active' imediato)
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 dias
            }, { onConflict: 'user_id' });
            
          if (subscriptionError) {
            console.error('Subscription creation error:', subscriptionError);
          }
        }
      }

      console.log('Registration successful:', newUserId, 'with plan:', role);
    } catch (error: any) {
      console.error('AuthService registration error:', error);
      throw new Error(error.message || 'Falha no registro. Tente novamente.');
    }
  },

  async loginWithGoogle(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google login error:', error);
        throw error;
      }

      console.log('Google login initiated');
    } catch (error: any) {
      console.error('AuthService Google login error:', error);
      throw new Error(error.message || 'Falha no login com Google.');
    }
  },

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      console.log('Logout successful');
    } catch (error: any) {
      console.error('AuthService logout error:', error);
      throw new Error(error.message || 'Falha ao sair.');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get current user error:', error);
        return null;
      }

      if (!user) {
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return null;
      }

      return {
        id: user.id,
        email: user.email || '',
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        createdAt: user.created_at ? new Date(user.created_at).getTime() : Date.now(),
        role: (profile?.role as any) || 'free',
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error in auth state change:', profileError);
            callback(null);
            return;
          }

          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || '',
            createdAt: session.user.created_at ? new Date(session.user.created_at).getTime() : Date.now(),
            role: (profile?.role as any) || 'free',
          };

          callback(user);
        } catch (error) {
          console.error('Error in auth state change:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
};