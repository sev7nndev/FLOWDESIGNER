import { useState, useEffect, useCallback } from 'react';
import { GeneratedImage, UserRole } from '../types';
import { getSupabase } from '../services/supabaseClient';
import { api } from '../services/api';

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
            // Chamada ao novo endpoint seguro no backend
            const response = await fetch(`${BACKEND_URL}/admin/images`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}` 
                }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Erro ao buscar todas as imagens.");
            }

            const data = await response.json();
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

        try {
            const response = await fetch(`${BACKEND_URL}/admin/images/${imageId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}` 
                },
                body: JSON.stringify({ imageUrl })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Erro ao deletar imagem.");
            }

            setImages(prev => prev.filter(img => img.id !== imageId));
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