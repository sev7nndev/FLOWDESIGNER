import { GeneratedImage, BusinessInfo, LandingImage } from "../types";
import { getSupabase } from "./supabaseClient";

// URL do seu Backend Node.js local (ou deployado)
// Alterado para usar caminho relativo para o backend Node.js (Issue 4 Fix)
const BACKEND_URL = "/api"; 

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
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro no servidor");
      }

      const data = await response.json();
      
      // --- SIMULATION BYPASS ---
      // O backend agora retorna uma URL pública diretamente em image_url.
      // Não precisamos mais gerar uma URL assinada para ela.
      return {
        id: data.image.id,
        url: data.image.image_url, // Usa a URL pública diretamente
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

    // --- SIMULATION BYPASS ---
    // O banco de dados agora contém URLs públicas diretamente.
    // Não precisamos mais gerar URLs assinadas para itens do histórico.
    const historyWithUrls = data.map((row: any) => {
        return {
            id: row.id,
            url: row.image_url, // Usa a URL pública diretamente
            prompt: row.prompt,
            businessInfo: row.business_info,
            createdAt: new Date(row.created_at).getTime()
        };
    });

    return historyWithUrls;
  },
  
  // --- Funções para Gerenciamento de Imagens da Landing Page ---
  
  getLandingImages: async (): Promise<LandingImage[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    // RLS permite SELECT público
    const { data, error } = await supabase
      .from('landing_carousel_images')
      .select('id, image_url, sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data) {
        console.error("Error fetching landing images:", error);
        return [];
    }

    // Converte o path do storage para URL pública (assumindo bucket 'landing-carousel' é público)
    const imagesWithUrls: LandingImage[] = data.map(row => {
        const { data: { publicUrl } } = supabase.storage
            .from('landing-carousel')
            .getPublicUrl(row.image_url);
            
        return {
            id: row.id,
            url: publicUrl,
            sortOrder: row.sort_order
        };
    });

    return imagesWithUrls;
  },
  
  uploadLandingImage: async (file: File, userId: string): Promise<LandingImage> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");
    
    const fileExtension = file.name.split('.').pop();
    // Armazena no formato: userId/timestamp.ext
    const filePath = `${userId}/${Date.now()}.${fileExtension}`;
    
    // 1. Upload para o bucket público (RLS deve permitir INSERT para admin/dev)
    const { error: uploadError } = await supabase.storage
      .from('landing-carousel')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Falha no upload: ${uploadError.message}`);
    }
    
    // 2. Inserir o path no banco de dados (RLS deve permitir INSERT para admin/dev)
    const { data: dbData, error: dbError } = await supabase
      .from('landing_carousel_images')
      .insert({ image_url: filePath, created_by: userId })
      .select('id, image_url, sort_order')
      .single();

    if (dbError || !dbData) {
      // Tenta remover o arquivo se a inserção falhar
      await supabase.storage.from('landing-carousel').remove([filePath]);
      throw new Error(`Falha ao registrar imagem: ${dbError?.message || 'Erro desconhecido'}`);
    }
    
    // 3. Retorna a URL pública
    const { data: { publicUrl } } = supabase.storage
        .from('landing-carousel')
        .getPublicUrl(dbData.image_url);
        
    return {
        id: dbData.id,
        url: publicUrl,
        sortOrder: dbData.sort_order
    };
  },
  
  deleteLandingImage: async (id: string, path: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");
    
    // 1. Deletar do banco de dados (RLS deve permitir DELETE para admin/dev)
    const { error: dbError } = await supabase
      .from('landing_carousel_images')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new Error(`Falha ao deletar registro: ${dbError.message}`);
    }
    
    // 2. Deletar do Storage (RLS deve permitir DELETE para admin/dev)
    const { error: storageError } = await supabase.storage
      .from('landing-carousel')
      .remove([path]);
      
    if (storageError) {
        // Loga o erro, mas não lança exceção, pois o registro do DB já foi removido.
        console.error("Falha ao deletar arquivo do storage:", storageError);
    }
  },

  // A função getDownloadUrl não é mais usada no fluxo principal, mas pode ser útil para outras coisas.
  getDownloadUrl: async (path: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para acessar arquivos.");

    const EDGE_FUNCTION_URL = `https://${"akynbiixxcftxgvjpjxu"}.supabase.co/functions/v1/get-signed-url`;

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
  }
};