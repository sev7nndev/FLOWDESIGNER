import { supabase } from './supabaseClient';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('🔍 Checking if user exists in profiles table...');
      
      // Primeiro, verificar se o usuário existe na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) {
        console.log('📝 Profile not found, will create after login');
      } else {
        console.log('✅ Profile found:', profile.email, 'Role:', profile.role);
      }
      
      console.log('🔑 Attempting Supabase auth...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Supabase auth error:', {
          message: error.message,
          status: error.status,
          code: error.code
        });
        
        // Tratamento específico de erros comuns
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Email ou senha inválidos. Verifique suas credenciais e tente novamente.');
        } else if (error.message?.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu email antes de fazer login.');
        } else if (error.message?.includes('Too many requests')) {
          throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
        } else if (error.message?.includes('User not found')) {
          throw new Error('Usuário não encontrado. Verifique o email ou cadastre-se.');
        } else {
          throw new Error(`Erro no login: ${error.message}`);
        }
      }

      if (!data.user) {
        console.error('❌ No user data returned from auth');
        throw new Error('Login falhou. Nenhum usuário retornado.');
      }

      console.log('✅ Supabase auth successful for user:', data.user.id);

      // Buscar ou criar o perfil completo após login bem-sucedido
      try {
        let userProfile = profile;
        
        if (!userProfile) {
          console.log('📝 Creating profile for authenticated user...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || email,
              role: 'free',
              status: 'on',
              first_name: '',
              last_name: ''
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating profile:', createError);
            throw new Error('Erro ao criar perfil de usuário.');
          }
          
          userProfile = newProfile;
          console.log('✅ Profile created successfully');
        } else {
          console.log('✅ Using existing profile');
        }

        // Retorna o usuário completo com perfil
        const userWithProfile: User = {
          id: data.user.id,
          email: data.user.email || email,
          firstName: userProfile.first_name || '',
          lastName: userProfile.last_name || '',
          createdAt: data.user.created_at ? new Date(data.user.created_at).getTime() : Date.now(),
          role: userProfile.role || 'free',
        };

        console.log('✅ Login successful:', userWithProfile.email, 'Role:', userWithProfile.role);
        return userWithProfile;
        
      } catch (profileErr) {
        console.error('❌ Error handling profile:', profileErr);
        throw new Error('Erro ao processar perfil do usuário.');
      }
      
    } catch (error: any) {
      console.error('❌ AuthService login error:', error);
      throw new Error(error.message || 'Falha no login. Tente novamente.');
    }
  },

  async register(firstName: string, lastName: string, email: string, password: string, planId?: string): Promise<void> {
    try {
      console.log('📝 Attempting registration for:', email, 'plan:', planId);
      
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
        console.error('❌ Registration error:', error);
        
        if (error.message?.includes('User already registered')) {
          throw new Error('Este e-mail já está cadastrado. Tente fazer login.');
        } else if (error.message?.includes('Password should be at least')) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        } else if (error.message?.includes('Email rate limit exceeded')) {
          throw new Error('Muitas tentativas de cadastro. Aguarde um minuto.');
        } else {
          throw new Error(error.message || 'Falha no registro. Tente novamente.');
        }
      }

      if (!data.user) {
        throw new Error('Registro falhou. Tente novamente.');
      }

      const newUserId = data.user.id;
      const role = planId || 'free';

      console.log('✅ Registration successful:', newUserId, 'role:', role);

      // Criar perfil para o usuário
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            email: data.user.email,
            role: role,
            status: 'on',
            first_name: firstName,
            last_name: lastName
          })
          .single();

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
        } else {
          console.log('✅ Profile created for user:', newUserId);
        }
      } catch (profileErr) {
        console.error('❌ Error creating profile:', profileErr);
      }

      // Se for um plano pago, criar assinatura
      if (planId && planId !== 'free') {
        try {
          console.log('💳 Creating subscription for plan:', planId);
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('id')
            .ilike('name', planId)
            .single();

          if (!planError && planData) {
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: newUserId,
                plan_id: planData.id,
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .single();

            if (subscriptionError) {
              console.error('❌ Subscription creation error:', subscriptionError);
            } else {
              console.log('✅ Subscription created for plan:', planId);
            }
          }
        } catch (subErr) {
          console.error('❌ Error handling subscription:', subErr);
        }
      }

    } catch (error: any) {
      console.error('❌ AuthService registration error:', error);
      throw new Error(error.message || 'Falha no registro. Tente novamente.');
    }
  },

  async loginWithGoogle(): Promise<void> {
    try {
      console.log('🔗 Initiating Google login');
      
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
        console.error('❌ Google login error:', error);
        throw new Error('Falha no login com Google. Tente novamente.');
      }

      console.log('✅ Google login initiated');
    } catch (error: any) {
      console.error('❌ AuthService Google login error:', error);
      throw new Error(error.message || 'Falha no login com Google.');
    }
  },

  async logout(): Promise<void> {
    try {
      console.log('🚪 Initiating logout');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        throw new Error('Falha ao sair.');
      }

      console.log('✅ Logout successful');
    } catch (error: any) {
      console.error('❌ AuthService logout error:', error);
      throw new Error(error.message || 'Falha ao sair.');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('👤 Getting current user');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Get current user error:', error);
        return null;
      }

      if (!user) {
        console.log('👤 No user session found');
        return null;
      }

      // Buscar perfil completo
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile fetch error:', profileError);
          if (profileError.code === 'PGRST116') {
            // Perfil não encontrado, retorna usuário com role padrão
            return {
              id: user.id,
              email: user.email || '',
              firstName: '',
              lastName: '',
              createdAt: user.created_at ? new Date(user.created_at).getTime() : Date.now(),
              role: 'free',
            };
          }
          return null;
        }

        const userWithProfile: User = {
          id: user.id,
          email: user.email || '',
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          createdAt: user.created_at ? new Date(user.created_at).getTime() : Date.now(),
          role: (profile?.role as any) || 'free',
        };

        console.log('✅ User with profile loaded:', userWithProfile.email, 'role:', userWithProfile.role);
        return userWithProfile;
      } catch (profileErr) {
        console.error('❌ Error fetching profile:', profileErr);
        return null;
      }
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    console.log('👂 Setting up auth state listener');
    
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        try {
          // Buscar perfil completo quando o estado de autenticação mudar
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('❌ Profile fetch error in auth state change:', profileError);
            if (profileError.code === 'PGRST116') {
              // Perfil não encontrado, retorna usuário com role padrão
              callback({
                id: session.user.id,
                email: session.user.email || '',
                firstName: '',
                lastName: '',
                createdAt: session.user.created_at ? new Date(session.user.created_at).getTime() : Date.now(),
                role: 'free',
              });
              return;
            }
            callback(null);
            return;
          }

          const userWithProfile: User = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || '',
            createdAt: session.user.created_at ? new Date(session.user.created_at).getTime() : Date.now(),
            role: (profile?.role as any) || 'free',
          };

          console.log('✅ Auth state changed - user authenticated:', userWithProfile.email, 'role:', userWithProfile.role);
          callback(userWithProfile);
        } catch (profileErr) {
          console.error('❌ Error in auth state change profile fetch:', profileErr);
          callback(null);
        }
      } else {
        console.log('👤 Auth state changed - user logged out');
        callback(null);
      }
    });
  }
};