import { User } from "../types";
import { getSupabase } from "./supabaseClient";

// We no longer store the full user object in localStorage, relying on Supabase SDK for session management.
// const SESSION_KEY is now unused.

export const authService = {
  init: () => {},

  login: async (email: string, password: string, shouldRemember: boolean = true): Promise<User | null> => {
    const supabase = getSupabase();
    
    if (!supabase) {
      throw new Error("Erro de conexão: O serviço de autenticação não está disponível.");
    }
    
    // Supabase JS v2.x expects options to be passed as the third argument to signInWithPassword
    // The options object should contain the 'shouldRemember' property directly, not nested under 'options'.
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      // Removed 'shouldRemember' from options as it causes TS error and session persistence is handled globally.
    });
    
    if (error) {
      throw new Error(error.message || 'Email ou senha inválidos.');
    }
    if (!data.user) return null;
    
    // We return null here. App.tsx will handle fetching the profile/role 
    // and setting the final User state based on the verified session.
    return null;
  },

  register: async (firstName: string, lastName: string, email: string, password: string): Promise<User | null> => {
    const supabase = getSupabase();

    if (!supabase) {
      throw new Error("Erro de conexão: O serviço de autenticação não está disponível.");
    }

    // SUPABASE REGISTER
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } }
    });
    
    if (error) throw new Error(error.message);
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
      throw new Error("Erro de conexão: O serviço de autenticação não está disponível.");
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