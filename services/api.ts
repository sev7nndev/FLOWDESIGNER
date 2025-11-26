import { GeneratedImage, BusinessInfo } from "../types";
import { getSupabase } from "./supabaseClient";

// URL do seu Backend Node.js local (ou deployado)
// Usa a variável de ambiente injetada pelo Vite, com fallback para localhost
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api";

// Função auxiliar para gerar URL assinada (Signed URL)
const getSignedUrl = async (path: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");

    // Gera uma URL válida por 60 segundos
    const { data, error } = await supabase.storage
        .from('generated-arts')
        .createSignedUrl(path, 60); 

    if (error) {
        console.error("Error generating signed URL:", error);
        // REMOVED INSECURE FALLBACK: return supabase.storage.from('generated-arts').getPublicUrl(path).data.publicUrl;
        throw new Error("Failed to generate secure download URL.");
    }
    return data.signedUrl;
};


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
          "Content-Type": "application/json",
          // Envia o token no cabeçalho Authorization: Bearer
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          promptInfo: businessInfo,
          // userToken removido do body
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro no servidor");
      }

      const data = await response.json();
      
      // Converte o formato do DB para o formato do frontend
      // Gera a URL assinada imediatamente após a geração
      const signedUrl = await getSignedUrl(data.image.image_url);

      return {
        id: data.image.id,
        url: signedUrl, // Usa a URL assinada
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

    // RLS garante que apenas os dados do usuário logado são retornados.
    const { data, error } = await supabase
      .from('images')
      .select('*')
      // Removido o filtro .eq('user_id', user.id) pois o RLS já o impõe.
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Mapeia e gera a URL assinada para cada imagem
    const historyWithUrls = await Promise.all(data.map(async (row: any) => {
        try {
            const signedUrl = await getSignedUrl(row.image_url);
            return {
                id: row.id,
                url: signedUrl, // Usa a URL assinada
                prompt: row.prompt,
                businessInfo: row.business_info,
                createdAt: new Date(row.created_at).getTime()
            };
        } catch (e) {
            console.warn(`Skipping image ${row.id} due to failed signed URL generation.`);
            return null; // Skip images that fail to generate a signed URL
        }
    })).then(results => results.filter((img): img is GeneratedImage => img !== null));

    return historyWithUrls;
  },
  
  // Expõe a função de download para o hook
  getDownloadUrl: getSignedUrl
};