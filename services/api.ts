import { GeneratedImage, BusinessInfo, LandingImage } from "../types";
import { getSupabase } from "./supabaseClient";

// URL do seu Backend Node.js local (ou deployado)
const BACKEND_URL = "/api"; 

export const api = {
  generate: async (businessInfo: BusinessInfo): Promise<GeneratedImage> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Erro de conexão com o App.");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para gerar artes.");

    try {
      const response = await fetch(`${BACKEND_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          promptInfo: businessInfo,
        })
      });

      if (!response.ok) {
        try {
          const err = await response.json();
          throw new Error(err.error || "Erro no servidor");
        } catch (e) {
          // Se a análise do JSON falhar, a resposta provavelmente estava vazia.
          console.error("Falha ao analisar a resposta de erro como JSON.", { status: response.status, statusText: response.statusText });
          throw new Error(`O servidor retornou um erro inesperado (Status: ${response.status}). Verifique se o backend está rodando corretamente.`);
        }
      }

      const data = await response.json();
      
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
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const historyWithUrls = data.map((row: any) => {
        return {
            id: row.id,
            url: row.image_url,
            prompt: row.prompt,
            businessInfo: row.business_info,
            createdAt: new Date(row.created_at).getTime()
        };
    });

    return historyWithUrls;
  },
  
  getLandingImages: async (): Promise<LandingImage[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('landing_carousel_images')
      .select('id, image_url, sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data) {
        console.error("Error fetching landing images:", error);
        return [];
    }

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
    const filePath = `${userId}/${Date.now()}.${fileExtension}`;
    
    const { error: uploadError } = await supabase.storage
      .from('landing-carousel')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Falha no upload: ${uploadError.message}`);
    }
    
    const { data: dbData, error: dbError } = await supabase
      .from('landing_carousel_images')
      .insert({ image_url: filePath, created_by: userId })
      .select('id, image_url, sort_order')
      .single();

    if (dbError || !dbData) {
      await supabase.storage.from('landing-carousel').remove([filePath]);
      throw new Error(`Falha ao registrar imagem: ${dbError?.message || 'Erro desconhecido'}`);
    }
    
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
    
    const { error: dbError } = await supabase
      .from('landing_carousel_images')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new Error(`Falha ao deletar registro: ${dbError.message}`);
    }
    
    const { error: storageError } = await supabase.storage
      .from('landing-carousel')
      .remove([path]);
      
    if (storageError) {
        console.error("Falha ao deletar arquivo do storage:", storageError);
    }
  },

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