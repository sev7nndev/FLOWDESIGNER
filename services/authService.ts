import { User } from "../types";
import { getSupabase } from "./supabaseClient";

// We no longer store the full user object in localStorage, relying on Supabase SDK for session management.
// const SESSION_KEY is now unused.

export const authService = {
  init: () => {},

  login: async (email: string, password: string): Promise<User | null> => {
    const supabase = getSupabase();
    
    if (!supabase) {
      // Este erro é lançado se SUPABASE_URL ou SUPABASE_ANON_KEY estiverem faltando no .env.local
      throw new Error("Erro de configuração: O serviço de autenticação não está configurado corretamente.");
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Tratamento de erros específicos do Supabase
      let errorMessage = error.message;
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha inválidos.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Confirme seu e-mail antes de fazer login.';
      }
      throw new Error(errorMessage);
    }
    if (!data.user) return null;
    
    // We return null here. App.tsx will handle fetching the profile/role 
    // and setting the final User state based on the verified session.
    return null;
  },

  register: async (firstName: string, lastName: string, email: string, password: string): Promise<User | null> => {
    const supabase = getSupabase();

    if (!supabase) {
      throw new Error("Erro de configuração: O serviço de autenticação não está configurado corretamente.");
    }

    // SUPABASE REGISTER
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } }
    });
    
    if (error) {
        let errorMessage = error.message;
        if (errorMessage.includes('User already registered')) {
            errorMessage = 'Este e-mail já está cadastrado. Tente fazer login.';
        }
        throw new Error(errorMessage);
    }
    if (!data.user) throw new Error("Erro ao criar usuário. Verifique seu email.");

    // We return null here. App.tsx will handle fetching the profile/role 
    // and setting the final User state based on the verified session.
    return null;
  },

  logout: async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
  },

  loginWithGoogle: async (): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Erro de configuração: O serviço de autenticação não está configurado corretamente.");
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // redirectTo: window.location.origin // Removido para usar a URL padrão configurada no Supabase, que está autorizada no Google.
      }
    });

    if (error) {
      throw new Error(error.message || 'Falha ao autenticar com o Google.');
    }
  },
};