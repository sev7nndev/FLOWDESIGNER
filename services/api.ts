import { GeneratedImage, BusinessInfo, LandingImage } from "../types";
import { getSupabase } from "./supabaseClient";

// URL do seu Backend Node.js local (ou deployado)
const BACKEND_URL = "/api"; 

export const api = {
  // ... (funções generate, getHistory, etc. existentes)
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
          
          if (err.quotaStatus === 'BLOCKED') {
              throw new Error(err.error || "Você atingiu o limite de gerações.");
          }
          
          throw new Error(err.error || "Erro no servidor");
        } catch (e) {
          console.error("Falha ao analisar a resposta de erro como JSON.", { status: response.status, statusText: response.statusText });
          throw new Error(`O servidor retornou um erro inesperado (Status: ${response.status}). Verifique se o backend está rodando corretamente.`);
        }
      }

      const data = await response.json();
      const jobId = data.jobId;
      
      let jobStatus = 'PENDING';
      let resultData: any = null;
      let attempts = 0;
      const MAX_ATTEMPTS = 60;
      
      while (jobStatus === 'PENDING' && attempts < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
          
          const statusResponse = await fetch(`${BACKEND_URL}/job-status/${jobId}`, {
              method: "GET",
              headers: {
                  "Authorization": `Bearer ${session.access_token}` 
              }
          });
          
          if (!statusResponse.ok) {
              throw new Error("Falha ao verificar o status do trabalho.");
          }
          
          resultData = await statusResponse.json();
          jobStatus = resultData.status;
          
          if (jobStatus === 'FAILED') {
              throw new Error(resultData.error || "A geração da imagem falhou.");
          }
      }
      
      if (jobStatus !== 'COMPLETED' || !resultData.imageUrl) {
          throw new Error("Tempo limite excedido ou trabalho não concluído.");
      }
      
      const supabaseAnonClient = getSupabase();
      
      const { data: imageRecord, error: fetchError } = await supabaseAnonClient!
        .from('images')
        .select('id, prompt, business_info, created_at, image_url')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (fetchError || !imageRecord) {
          console.error("Falha ao buscar metadados da imagem recém-gerada:", fetchError);
          throw new Error("Arte gerada, mas falha ao carregar metadados.");
      }
      
      const { data: { publicUrl } } = supabaseAnonClient!.storage
          .from('generated-arts')
          .getPublicUrl(imageRecord.image_url);
          
      return {
          id: imageRecord.id,
          url: publicUrl,
          prompt: imageRecord.prompt,
          businessInfo: imageRecord.business_info,
          createdAt: new Date(imageRecord.created_at).getTime()
      };

    } catch (error) {
      console.error("Erro ao gerar:", error);
      throw error;
    }
  },

  getHistory: async (): Promise<GeneratedImage[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const response = await fetch(`${BACKEND_URL}/history`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${session.access_token}` 
        }
    });
    
    if (!response.ok) {
        console.error("Failed to fetch history from backend:", response.status);
        return [];
    }
    
    const history = await response.json();
    return history;
  },
  
  getLandingImages: async (): Promise<LandingImage[]> => {
    const response = await fetch(`${BACKEND_URL}/landing-images`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    });

    if (!response.ok) {
        console.error("Failed to fetch landing images from backend:", response.status);
        return [];
    }
    
    const images = await response.json();
    return images;
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
                resolve(data.image);
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
            body: JSON.stringify({ imagePath })
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

  // NOVA FUNÇÃO PARA PAGAMENTO
  createCheckoutSession: async (priceId: string): Promise<{ sessionId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Erro de conexão com o App.");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para iniciar uma assinatura.");

    const response = await fetch(`${BACKEND_URL}/payments/create-checkout-session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ priceId })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Falha ao criar sessão de pagamento.");
    }

    return response.json();
  }
};