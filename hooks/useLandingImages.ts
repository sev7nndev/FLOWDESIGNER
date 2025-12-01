import { useState, useEffect, useCallback } from 'react';
import { LandingImage, UserRole } from '../types';
import { api } from '../services/api';

export const useLandingImages = (userRole: UserRole) => {
    const [images, setImages] = useState<LandingImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedImages = await api.getLandingImages();
            setImages(fetchedImages);
        } catch (e: any) {
            console.error("Failed to fetch landing images:", e);
            setError("Falha ao carregar imagens da Landing Page.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);
    
    const uploadImage = useCallback(async (file: File, userId: string) => {
        if (userRole !== 'admin' && userRole !== 'dev') {
            throw new Error("Acesso negado. Apenas administradores e desenvolvedores podem fazer upload.");
        }
        
        try {
            const newImage = await api.uploadLandingImage(file, userId);
            setImages((prev: LandingImage[]) => [...prev, newImage].sort((a, b) => a.sortOrder - b.sortOrder));
        } catch (e: any) {
            throw new Error(e.message || "Erro ao fazer upload da imagem.");
        }
    }, [userRole]);
    
    // CORREÇÃO: Agora aceita imagePath e o passa para a API
    const deleteImage = useCallback(async (id: string, path: string) => {
        if (userRole !== 'admin' && userRole !== 'dev') {
            throw new Error("Acesso negado. Apenas administradores e desenvolvedores podem deletar.");
        }
        
        try {
            await api.deleteLandingImage(id, path);
            setImages((prev: LandingImage[]) => prev.filter((img: LandingImage) => img.id !== id));
        } catch (e: any) {
            throw new Error(e.message || "Erro ao deletar a imagem.");
        }
    }, [userRole]);

    return {
        images,
        isLoading,
        error,
        fetchImages,
        uploadImage,
        deleteImage
    };
};