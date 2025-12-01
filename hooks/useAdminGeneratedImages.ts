import { useState, useEffect, useCallback } from 'react';
import { GeneratedImage, UserRole } from '../types';
import { getSupabase } from '../services/supabaseClient';

// URL do seu Backend Node.js local (ou deployado)
const BACKEND_URL = "/api"; 

export const useAdminGeneratedImages = (userRole: UserRole) => {
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabase();

    const fetchAllImages = useCallback(async () => {
        if (userRole !== 'admin' && userRole !== 'dev') {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        if (!supabase) {
            setError("Supabase não configurado.");
            setIsLoading(false);
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setError("Sessão não encontrada.");
            setIsLoading(false);
            return;
        }

        try {
            // Chamada ao endpoint seguro no backend
            const response = await fetch(`${BACKEND_URL}/admin/images`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}` 
                }
            });

            if (!response.ok) {
                let errorBody = { error: `Erro do servidor: Status ${response.status}` };
                try {
                    // Tenta analisar o corpo da resposta como JSON
                    errorBody = await response.json();
                } catch (e) {
                    // Se falhar (ex: Unexpected end of JSON input), usa a mensagem padrão
                    console.warn("Falha ao analisar JSON de erro do backend.");
                }
                throw new Error(errorBody.error || `Erro desconhecido: Status ${response.status}`);
            }

            const data = await response.json();
            
            // O backend retorna o objeto completo, incluindo a URL pública (url)
            setImages(data.images);

        } catch (e: any) {
            console.error("Failed to fetch all generated images:", e);
            setError(e.message || "Falha ao carregar todas as artes geradas.");
        } finally {
            setIsLoading(false);
        }
    }, [userRole, supabase]);

    useEffect(() => {
        fetchAllImages();
    }, [fetchAllImages]);
    
    // Função para deletar uma imagem (usando o endpoint seguro do backend)
    const deleteImage = useCallback(async (imageId: string, imageUrl: string) => {
        if (userRole !== 'admin' && userRole !== 'dev') {
            throw new Error("Acesso negado.");
        }
        
        if (!supabase) throw new Error("Supabase não configurado.");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão não encontrada.");

        // Extrai o path do storage a partir da URL pública
        // Ex: '.../generated-arts/user-id/uuid.jpeg' -> 'user-id/uuid.jpeg'
        const urlParts = imageUrl.split('/generated-arts/');
        const imagePath = urlParts.length > 1 ? urlParts[1] : '';
        
        if (!imagePath) {
            throw new Error("Caminho do arquivo inválido para exclusão.");
        }

        try {
            const response = await fetch(`${BACKEND_URL}/admin/images/${imageId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}` 
                },
                body: JSON.stringify({ imagePath }) // Passa o path do storage
            });

            if (!response.ok) {
                let errorBody = { error: `Erro do servidor: Status ${response.status}` };
                try {
                    errorBody = await response.json();
                } catch (e) {
                    console.warn("Falha ao analisar JSON de erro de exclusão.");
                }
                throw new Error(errorBody.error || `Falha ao deletar imagem: Status ${response.status}`);
            }

            setImages((prev: GeneratedImage[]) => prev.filter((img: GeneratedImage) => img.id !== imageId));
            return true;
        } catch (e: any) {
            console.error("Failed to delete image:", e);
            throw new Error(e.message || "Falha ao deletar a arte.");
        }
    }, [userRole, supabase]);


    return {
        allImages: images,
        isLoadingAllImages: isLoading,
        errorAllImages: error,
        fetchAllImages,
        deleteImage
    };
};