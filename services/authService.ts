import { User } from "../types";
import { getSupabase } from "./supabaseClient";

// We no longer store the full user object in localStorage, relying on Supabase SDK for session management.
// const SESSION_KEY is now unused.

export const authService = {
  init: () => { },

  login: async (email: string, password: string): Promise<User | null> => {
    const supabase = getSupabase();

    if (!supabase) {
      throw new Error("Erro de conexão: O serviço de autenticação não está disponível.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

    // BACKEND REGISTER (Safe Profile Creation)
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha no cadastro");
      }

      // After server creates user, we try to login immediately to set the session on the client
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        // If auto-login fails (maybe email confirmation needed), just return null
        // The UI will likely show "Success, please login" anyway.
        console.warn("Auto-login after register failed:", loginError);
      }

    } catch (e: any) {
      throw new Error(e.message);
    }

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
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent select_account',
        },
      }
    });

    if (error) {
      throw new Error(error.message || 'Falha ao autenticar com o Google.');
    }
  },
};