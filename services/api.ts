import { GeneratedImage, BusinessInfo, LandingImage, QuotaCheckResponse, EditablePlan, ArtStyle } from "../types";
import { getSupabase } from "./supabaseClient";

// URL do seu Backend Node.js local (ou deployado)
const BACKEND_URL = "/api";

export const api = {
    generate: async (businessInfo: BusinessInfo, artStyle: ArtStyle, retryCount = 0): Promise<GeneratedImage> => {
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
                    form: businessInfo,
                    selectedStyle: artStyle,
                })
            });

            if (!response.ok) {
                // Handle 429 Rate Limit with retry
                if (response.status === 429 && retryCount < 2) {
                    const waitTime = 3000 * (retryCount + 1); // 3s, 6s
                    console.log(`⏳ Rate limit atingido. Tentando novamente em ${waitTime/1000}s... (tentativa ${retryCount + 1}/2)`);
                    
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return api.generate(businessInfo, artStyle, retryCount + 1);
                }

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

                    // Handle 429 with better message
                    if (response.status === 429) {
                        throw new Error(err.error || "Limite de requisições atingido. Por favor, aguarde alguns minutos e tente novamente.");
                    }

                    throw new Error(err.error || "Erro no servidor");
                } catch (e) {
                    // Re-throw quota error if caught here
                    if ((e as any).quotaStatus === 'BLOCKED') throw e;
                    
                    // Re-throw if it's already a proper Error
                    if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e;

                    console.error("Falha ao analisar a resposta de erro como JSON.", { status: response.status, statusText: response.statusText });
                    
                    // Better error message for 429
                    if (response.status === 429) {
                        throw new Error("Limite de requisições atingido. Por favor, aguarde 1-2 minutos e tente novamente.");
                    }
                    
                    throw new Error(`O servidor retornou um erro inesperado (Status: ${response.status}). Verifique se o backend está rodando corretamente.`);
                }
            }

            const data = await response.json();

            // NEW: Handle base64 response from Freepik Mystic
            if (data.base64) {
                // Create a temporary image record for display
                return {
                    id: `temp-${Date.now()}`,
                    url: data.base64,
                    prompt: businessInfo.details,
                    businessInfo: businessInfo,
                    createdAt: Date.now()
                };
            }

            // Legacy: Get a secure, signed URL for the newly created image
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

    deleteImage: async (id: string): Promise<void> => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase not configured.");

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Faça login para deletar imagens.");

        try {
            const response = await fetch(`${BACKEND_URL}/images/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Falha ao deletar imagem.");
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            throw error;
        }
    },


    getHistory: async (): Promise<GeneratedImage[]> => {
        console.log('🔍 getHistory: INÍCIO DA FUNÇÃO');
        
        const supabase = getSupabase();
        if (!supabase) {
            console.log('❌ getHistory: Supabase não configurado');
            return [];
        }
        console.log('✅ getHistory: Supabase configurado');

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.error('❌ getHistory: Erro ao buscar sessão:', sessionError);
            return [];
        }
        
        console.log('✅ getHistory: Sessão encontrada');
        console.log('📡 getHistory: Chamando backend /api/history...');

        try {
            // Use backend endpoint instead of direct Supabase query
            const response = await fetch('http://localhost:3001/api/history', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ getHistory: Backend error:', errorData);
                return [];
            }

            const { images } = await response.json();
            console.log(`✅ getHistory: Backend retornou ${images?.length || 0} imagens`);

            return images || [];
        } catch (error) {
            console.error('❌ getHistory: Fetch error:', error);
            return [];
        }
    },

    // NEW: Fetch all plan settings (combined limits and details from single table now)
    getPlanSettings: async (): Promise<EditablePlan[]> => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase not configured.");

        // Fetch everything from plan_settings
        const { data: settingsData, error: settingsError } = await supabase
            .from('plan_settings')
            .select('*');

        if (settingsError) {
            console.error("Error fetching plan_settings:", settingsError);
            throw new Error(settingsError.message);
        }

        if (!settingsData) return [];

        // Map to EditablePlan
        const plans: EditablePlan[] = settingsData.map(setting => ({
            id: setting.id as any,
            display_name: setting.display_name || setting.id,
            description: setting.description || '',
            features: setting.features || [],
            price: setting.price || 0,
            max_images_per_month: setting.max_images_per_month || 0,
        }));

        return plans;
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
                let errorBody: any = {};
                try {
                    errorBody = await response.json();
                    errorMessage = errorBody.error || errorMessage;
                } catch (e) {
                    // Ignore if response body is not JSON
                }

                // If the backend returns the full quota response structure even on error (e.g., BLOCKED)
                if (errorBody.status) {
                    return errorBody as QuotaCheckResponse;
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

    // NEW: Admin update plan settings (now handles both tables via Backend Route)
    updatePlanSettings: async (plans: EditablePlan[]): Promise<void> => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase not configured.");

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Acesso negado.");

        try {
            const response = await fetch(`${BACKEND_URL}/admin/plans`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ plans })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Falha ao atualizar planos.");
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

    // FIX 3: Call backend endpoint to get the full MP Connect URL
    getMercadoPagoConnectUrl: async (): Promise<string> => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase not configured.");

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Acesso negado. Faça login como administrador.");

        try {
            const response = await fetch(`${BACKEND_URL}/admin/mp-connect`, {
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Falha ao obter URL de conexão MP: Status ${response.status}`);
            }

            const data = await response.json();
            return data.connectUrl;
        } catch (error) {
            console.error("Error fetching MP connect URL:", error);
            throw error;
        }
    },

    // NEW: Exchange OAuth Code for Token
    exchangeMpCode: async (code: string): Promise<void> => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase not configured.");
        const { data: { session } } = await supabase.auth.getSession();

        // Updated to match backend route /api/admin/mp-exchange
        const response = await fetch(`${BACKEND_URL}/admin/mp-exchange`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Falha na troca de código MP");
        }

        return await response.json();
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
        // If the path is already a full URL (e.g., from Pollinations.ai) or a Data URL, return it directly
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            console.log('✓ URL is already public or data URI, returning directly:', path.substring(0, 50) + '...');
            return path;
        }

        // Otherwise, it's a Supabase Storage path, get signed URL
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase not configured.");

        // Direct Client Generation (No Edge Function needed)
        try {
            const { data, error } = await supabase
                .storage
                .from('generated-images')
                .createSignedUrl(path, 3600); // 1 Hour Expiry

            if (error) throw error;
            if (!data?.signedUrl) throw new Error("URL não gerada.");

            return data.signedUrl;

        } catch (error) {
            console.error("Error generating signed URL:", error);
            // Fallback: If signing fails, return the path? No, that won't load.
            throw new Error("Falha ao gerar URL de download segura.");
        }
    },

    enhancePrompt: async (prompt: string, promptInfo?: BusinessInfo): Promise<string> => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase not configured.");

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Faça login para usar a IA.");

        try {
            const response = await fetch(`${BACKEND_URL}/enhance-prompt`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    prompt,
                    promptInfo
                })
            });

            if (!response.ok) {
                throw new Error("Falha ao melhorar prompt.");
            }

            const data = await response.json();
            return data.enhancedPrompt;
        } catch (error) {
            console.error("Error enhancing prompt:", error);
            throw error;
        }
    }
};