import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { LandingImage, User } from '../types';

interface UseLandingImagesResult {
    images: LandingImage[];
    isLoading: boolean;
    error: string | null;
    uploadImage: (file: File) => Promise<void>;
    deleteImage: (id: string, imagePath: string) => Promise<void>;
}

export const useLandingImages = (user: User | null): UseLandingImagesResult => { // FIX: Accepts User | null (Error 9)
    const [images, setImages] = useState<LandingImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchImages = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fetchedImages = await api.getLandingImages();
            setImages(fetchedImages);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch images');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const uploadImage = useCallback(async (file: File) => {
        if (!user) {
            setError("User not authenticated for upload.");
            return;
        }
        setError(null);
        try {
            const newImage = await api.uploadLandingImage(file, user.id); // FIX: Passing userId from closure (Error 10)
            setImages((prev) => [...prev, newImage]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to upload image');
            throw e;
        }
    }, [user]);

    const deleteImage = useCallback(async (id: string, imagePath: string) => {
        setError(null);
        try {
            await api.deleteLandingImage(id, imagePath);
            setImages((prev) => prev.filter((img) => img.id !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to delete image');
            throw e;
        }
    }, []);

    return { images, isLoading, error, uploadImage, deleteImage };
};