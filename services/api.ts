
import { GeneratedImage, BusinessInfo } from "../types";
import { getSupabase } from "./supabaseClient";

// URL do seu Backend Node.js local (ou deployado)
const BACKEND_URL = "http://localhost:3001/api";

export const api = {
  generate: async (businessInfo: BusinessInfo): Promise<GeneratedImage> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Erro de conexão com o App.");

    // Pegar o token de sessão atual do usuário para enviar ao backend
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para gerar artes.");

    try {
      // Chama o SEU backend, não a API externa
      const response = await fetch(`${BACKEND_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          promptInfo: businessInfo,
          userToken: session.access_token // Envia o token para validação
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro no servidor");
      }

      const data = await response.json();
      
      // Converte o formato do DB para o formato do frontend
      return {
        id: data.image.id,
        url: data.image.image_url,
        prompt: data.image.prompt,
        businessInfo: data.image.business_info,
        createdAt: new Date(data.image.created_at).getTime()
      };

    } catch (error) {
      console.error("Erro ao gerar:", error);
      throw error;
    }
  },

  getHistory: async (): Promise<GeneratedImage[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      url: row.image_url,
      prompt: row.prompt,
      businessInfo: row.business_info,
      createdAt: new Date(row.created_at).getTime()
    }));
  }
};
