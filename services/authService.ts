import { User, UserRole } from "../types";
import { getSupabase } from "./supabaseClient";

const SESSION_KEY = "flow_session";

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
    
    // Buscar Role na tabela de profiles
    let role: UserRole = 'client';
    
    // Fetch role from the profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, first_name')
      .eq('id', data.user.id)
      .single();
    
    if (profile?.role) role = profile.role as UserRole;

    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      name: profile?.first_name || data.user.user_metadata.name || email.split('@')[0],
      role: role,
      createdAt: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const supabase = getSupabase();

    if (!supabase) {
      throw new Error("Erro de conexão: O serviço de autenticação não está disponível.");
    }

    // SUPABASE REGISTER
    // Note: The role is set via the handle_new_user trigger on the database side.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Erro ao criar usuário. Verifique seu email.");

    // Since the profile is created asynchronously via trigger, we assume 'client' for immediate session, 
    // but the role will be corrected on next login/session refresh.
    const role: UserRole = 'client'; 

    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      name: name,
      role: role,
      createdAt: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  logout: async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }
};