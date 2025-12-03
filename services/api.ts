import { GeneratedImage, BusinessInfo, LandingImage, PlanSetting, QuotaCheckResponse, PlanDetail, EditablePlan } from "../types";
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
          
          // Handle Quota Blocked error specifically
          if (err.quotaStatus === 'BLOCKED') {
              const quotaError = new Error(err.error || "Limite de geração atingido.");
              (quotaError as any).quotaStatus = 'BLOCKED';
              (quotaError as any).usage = err.usage;
              (quotaError as any).plan = err.plan;
              throw quotaError;
          }
          
          throw new Error(err.error || "Erro no servidor");
        } catch (e) {
          // Re-throw quota error if caught here
          if ((e as any).quotaStatus === 'BLOCKED') throw e;
          
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
  
  // NEW: Fetch all plan settings (combined limits and details)
  getPlanSettings: async (): Promise<EditablePlan[]> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");
    
    try {
        // Fetch limits/prices
        const { data: settingsData, error: settingsError } = await supabase
            .from('plan_settings')
            .select('*');
            
        if (settingsError) throw new Error(settingsError.message);
        
        // Fetch marketing details
        const { data: detailsData, error: detailsError } = await supabase
            .from('plan_details')
            .select('*');
            
        if (detailsError) throw new Error(detailsError.message);
        
        const settingsMap = new Map(settingsData.map(s => [s.id, s]));
        
        // Combine data
        const combinedPlans: EditablePlan[] = detailsData.map(detail => {
            const setting = settingsMap.get(detail.id);
            return {
                id: detail.id as any,
                display_name: detail.display_name,
                description: detail.description,
                features: detail.features,
                price: setting?.price || 0,
                max_images_per_month: setting?.max_images_per_month || 0,
            };
        });
        
        return combinedPlans;
    } catch (error) {
        console.error("Error fetching plan settings:", error);
        // Return empty array instead of throwing, as this is used by the LandingPage too
        return [];
    }
  },
  
  // NEW: Check user quota status
  checkQuota: async (): Promise<QuotaCheckResponse> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Usuário não autenticado.");

    try {
        const response = await fetch(`${BACKEND_URL}/check-quota`, {
            headers: {
                "Authorization": `Bearer ${session.access_token}` 
            }
        });
        
        if (!response.ok) {
            let errorMessage = "Falha ao verificar quota.";
            try {
                const err = await response.json();
                errorMessage = err.error || errorMessage;
            } catch (e) {
                // Ignore if response body is not JSON
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data as QuotaCheckResponse;
    } catch (error) {
        console.error("Error checking quota:", error);
        throw error;
    }
  },
  
  // NEW: Admin update plan settings (now handles both tables)
  updatePlanSettings: async (plans: EditablePlan[]): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Acesso negado.");

    try {
        // 1. Prepare updates for plan_settings (limits/price)
        const settingsUpdates = plans.map(p => ({
            id: p.id,
            price: p.price,
            max_images_per_month: p.max_images_per_month,
            updated_by: session.user.id,
            updated_at: new Date().toISOString()
        }));
        
        // 2. Prepare updates for plan_details (marketing info)
        const detailsUpdates = plans.map(p => ({
            id: p.id,
            display_name: p.display_name,
            description: p.description,
            features: p.features,
            updated_at: new Date().toISOString()
        }));
        
        // Execute updates in parallel
        const [settingsResult, detailsResult] = await Promise.all([
            supabase.from('plan_settings').upsert(settingsUpdates, { onConflict: 'id' }),
            supabase.from('plan_details').upsert(detailsUpdates, { onConflict: 'id' })
        ]);
        
        if (settingsResult.error) {
            console.error("Error updating plan_settings:", settingsResult.error);
            throw new Error(settingsResult.error.message);
        }
        
        if (detailsResult.error) {
            console.error("Error updating plan_details:", detailsResult.error);
            throw new Error(detailsResult.error.message);
        }
        
    } catch (error) {
        console.error("Error updating plan settings via backend:", error);
        throw error;
    }
  },
  
  // NEW: Initiate Mercado Pago subscription
  initiateSubscription: async (planId: string): Promise<{ paymentUrl: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para assinar.");

    try {
        const response = await fetch(`${BACKEND_URL}/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}` 
            },
            body: JSON.stringify({ planId })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Falha ao iniciar assinatura: Status ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error initiating subscription:", error);
        throw error;
    }
  },
  
  // NEW: Mercado Pago OAuth Connect URL (for Dev Panel)
  getMercadoPagoConnectUrl: () => {
    return `${BACKEND_URL}/admin/mp-connect`;
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
            // Try to read JSON error body, but fallback gracefully if it's empty
            let errorMessage = `Falha ao deletar imagem da landing page: Status ${response.status}`;
            try {
                const err = await response.json();
                errorMessage = err.error || errorMessage;
            } catch (e) {
                // If JSON parsing fails (e.g., empty body), use the default message
                console.warn("Failed to parse JSON error response, assuming empty body.");
            }
            throw new Error(errorMessage);
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