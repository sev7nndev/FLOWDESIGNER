import { useCallback } from 'react';
import useSWR from 'swr';
import { LandingImage, UserRole } from '../types';
import { api } from '../services/api';

export const useLandingImages = (userRole: UserRole) => {

    // Fetch Landing Images (Public, Cached)
    const {
        data: images = [],
        error: swrError,
        isLoading,
        mutate
    } = useSWR(
        'landing-images',
        () => api.getLandingImages(),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000 * 5 // 5 minutes cache
        }
    );

    const uploadImage = useCallback(async (file: File, userId: string) => {
        if (userRole !== 'admin' && userRole !== 'dev') {
            throw new Error("Acesso negado.");
        }
        try {
            const newImage = await api.uploadLandingImage(file, userId);
            // Optimistic / Direct update
            mutate((current) => {
                const list = current ? [...current, newImage] : [newImage];
                return list.sort((a, b) => a.sortOrder - b.sortOrder);
            }, false);
        } catch (e: any) {
            throw new Error(e.message || "Erro ao fazer upload.");
        }
    }, [userRole, mutate]);

    const deleteImage = useCallback(async (id: string, path: string) => {
        if (userRole !== 'admin' && userRole !== 'dev') {
            throw new Error("Acesso negado.");
        }
        try {
            await api.deleteLandingImage(id, path);
            mutate((current) => current?.filter(img => img.id !== id), false);
        } catch (e: any) {
            throw new Error(e.message || "Erro ao deletar.");
        }
    }, [userRole, mutate]);

    return {
        images,
        isLoading,
        error: swrError ? "Falha ao carregar imagens." : null,
        fetchImages: mutate,
        uploadImage,
        deleteImage
    };
};