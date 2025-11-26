import { GeneratedImage, BusinessInfo } from "../types";
import { getSupabase } from "./supabaseClient";

// URL do seu Backend Node.js local (ou deployado)
// Alterado para usar caminho relativo para o backend Node.js (Issue 4 Fix)
const BACKEND_URL = "/api"; 

// URL da Edge Function (Hardcoded Project ID + Function Name)
const SUPABASE_PROJECT_ID = "akynbiixxcftxgvjpjxu";
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-signed-url`;

// Função auxiliar para gerar URL assinada (Signed URL)
const getSignedUrl = async (path: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para acessar arquivos.");

    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}` 
            },
            body: JSON.stringify({ path })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Erro ao gerar URL segura.");
        }

        const data = await response.json();
        return data.signedUrl;

    } catch (error) {
        console.error("Error generating signed URL via Edge Function:", error);
        throw new Error("Falha ao gerar URL de download segura.");
    }
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
      // Gera a URL assinada imediatamente após a geração usando a nova função segura
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
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Mapeia e gera a URL assinada para cada imagem
    const historyWithUrls = await Promise.all(data.map(async (row: any) => {
        try {
            // Usa a nova função segura para obter a URL
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