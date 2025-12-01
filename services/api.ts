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
          console.error("Falha ao analisar a resposta de erro como JSON.", { status: response.status, statusText: response.statusText });
          throw new Error(`O servidor retornou um erro inesperado (Status: ${response.status}). Verifique se o backend está rodando corretamente.`);
        }
      }

      const data = await response.json();
      
      // Get a secure, signed URL for the newly created image
      const signedUrl = await api.getDownloadUrl(data.image.image_url);

      return {
        id: data.image.id,
        url: signedUrl,
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

    // Generate signed URLs for all images in parallel for performance
    const historyWithUrls = await Promise.all(data.map(async (row: any) => {
        try {
            const signedUrl = await api.getDownloadUrl(row.image_url);
            return {
                id: row.id,
                url: signedUrl,
                prompt: row.prompt,
                businessInfo: row.business_info,
                createdAt: new Date(row.created_at).getTime()
            };
        } catch (e) {
            console.warn(`Could not get signed URL for image ${row.id}. It might have been deleted.`);
            return null;
        }
    }));

    // Filter out any images that failed to get a URL
    return historyWithUrls.filter((item): item is GeneratedImage => item !== null);
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
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para fazer upload de imagens.");

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const fileBase64 = reader.result as string;
            const fileName = file.name;

            try {
                const response = await fetch(`${BACKEND_URL}/admin/landing-images/upload`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}` 
                    },
                    body: JSON.stringify({ fileBase64, fileName, userId })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || `Falha ao fazer upload da imagem da landing page: Status ${response.status}`);
                }
                const data = await response.json();
                resolve(data.image); // Backend should return the full LandingImage object
            } catch (error) {
                console.error("Error uploading landing image via backend:", error);
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
  },
  
  deleteLandingImage: async (id: string, imagePath: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para deletar imagens.");

    try {
        const response = await fetch(`${BACKEND_URL}/admin/landing-images/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}` 
            },
            body: JSON.stringify({ imagePath }) // Pass the imagePath to the backend
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Falha ao deletar imagem da landing page: Status ${response.status}`);
        }
    } catch (error) {
        console.error("Error deleting landing image via backend:", error);
        throw error;
    }
  },

  getDownloadUrl: async (path: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para acessar arquivos.");

    // Use environment variable for Supabase Project ID (Issue 3 Fix)
    const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-signed-url`;

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