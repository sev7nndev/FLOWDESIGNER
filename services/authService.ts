import { User, UserRole } from "../types";
import { getSupabase } from "./supabaseClient";

// We no longer store the full user object in localStorage, relying on Supabase SDK for session management.
// The SESSION_KEY is now unused in this file, but kept for reference if needed elsewhere.
// const SESSION_KEY = "flow_session"; 

export const authService = {
  init: () => {},

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

  register: async (name: string, email: string, password: string): Promise<User | null> => {
    const supabase = getSupabase();

    if (!supabase) {
      throw new Error("Erro de conexão: O serviço de autenticação não está disponível.");
    }

    // SUPABASE REGISTER
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
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
    // Removed localStorage.removeItem(SESSION_KEY);
  },

  // This function is now obsolete as we don't store the user object locally anymore.
  // getCurrentUser: (): User | null => {
  //   const session = localStorage.getItem(SESSION_KEY);
  //   return session ? JSON.parse(session) : null;
  // }
};