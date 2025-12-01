import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { LandingImage, User } from '../types';

export const useLandingImages = (user: User | null) => {
    const [images, setImages] = useState<LandingImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedImages = await api.getLandingImages();
            setImages(fetchedImages);
        } catch (e: any) {
            console.error("Failed to fetch landing images:", e);
            setError(e.message || "Falha ao carregar imagens da Landing Page.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const uploadImage = useCallback(async (file: File) => {
        if (!user || user.role !== 'dev') {
            setError("Permissão negada.");
            return;
        }
        
        setIsUploading(true);
        setError(null);
        
        try {
            const newImage = await api.uploadLandingImage(file, user.id);
            setImages(prev => [newImage, ...prev]); // Adiciona a nova imagem ao topo
            return newImage;
        } catch (e: any) {
            console.error("Failed to upload landing image:", e);
            setError(e.message || "Falha ao fazer upload da imagem.");
            throw e; // Re-lança para o componente poder tratar
        } finally {
            setIsUploading(false);
        }
    }, [user]);

    const deleteImage = useCallback(async (id: string, imagePath: string) => {
        if (!user || user.role !== 'dev') {
            setError("Permissão negada.");
            return;
        }
        
        setError(null);
        try {
            await api.deleteLandingImage(id, imagePath);
            setImages(prev => prev.filter(img => img.id !== id));
        } catch (e: any) {
            console.error("Failed to delete landing image:", e);
            setError(e.message || "Falha ao deletar a imagem.");
            throw e;
        }
    }, [user]);

    return {
        images,
        isLoading,
        error,
        isUploading,
        fetchImages,
        uploadImage,
        deleteImage,
    };
};