
import { User, UserRole } from "../types";
import { getSupabase } from "./supabaseClient";

const USERS_KEY = "flow_users";
const SESSION_KEY = "flow_session";

const DEV_EMAIL = "sevenbeatx@gmail.com";

export const authService = {
  init: () => {},

  login: async (email: string, password: string): Promise<User | null> => {
    const supabase = getSupabase();
    
    // --- LOGIN LOCAL (BACKDOOR DE CONFIGURAÇÃO) ---
    // Permite entrar para configurar as chaves ANTES do Supabase estar conectado
    if (email === DEV_EMAIL && password === "24526082") {
      const devUser: User = {
        id: "master-dev-local",
        name: "SevenBeatx (Dev)",
        email: email,
        role: "admin",
        createdAt: Date.now()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(devUser));
      return devUser;
    }

    // --- LOGIN SUPABASE OFICIAL ---
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return null;
      
      // Buscar Role na tabela de profiles
      let role: UserRole = 'client';
      
      // 1. Verifica se é o Dev Supremo (Hardcoded Security)
      if (data.user.email === DEV_EMAIL) {
        role = 'admin';
      } else {
        // 2. Busca do banco de dados
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (profile?.role) role = profile.role as UserRole;
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata.name || email.split('@')[0],
        role: role,
        createdAt: Date.now()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    } 
    
    // --- FALLBACK LOCAL PARA TESTES ---
    else {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (user) {
        const { password, ...safeUser } = user;
        localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
        return safeUser as User;
      }
      return null;
    }
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const supabase = getSupabase();

    if (supabase) {
      // SUPABASE REGISTER
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Erro ao criar usuário. Verifique seu email.");

      // Role automática baseada no email (definida também no Trigger do SQL por segurança)
      const role = email === DEV_EMAIL ? 'admin' : 'client';

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: name,
        role: role,
        createdAt: Date.now()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;

    } else {
      // LOCAL REGISTER (Simulação)
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      
      if (users.find((u: any) => u.email === email)) {
        throw new Error("Email já cadastrado");
      }

      const role: UserRole = email === DEV_EMAIL ? 'admin' : 'client';

      const newUser = {
        id: crypto.randomUUID(),
        name,
        email,
        password,
        role: role,
        createdAt: Date.now()
      };

      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const { password: _, ...safeUser } = newUser;
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return safeUser as User;
    }
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
