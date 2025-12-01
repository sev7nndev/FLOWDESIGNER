import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { LandingImage, User } from '../types';

interface UseLandingImagesResult {
    images: LandingImage[];
    isLoading: boolean;
    error: string | null;
    isUploading: boolean; // FIX: Added missing property (Error 38)
    uploadImage: (file: File) => Promise<void>;
    deleteImage: (id: string, imagePath: string) => Promise<void>;
}

export const useLandingImages = (user: User | null): UseLandingImagesResult => {
    const [images, setImages] = useState<LandingImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false); // FIX: Added state for isUploading

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
        setIsUploading(true); // Set to true before upload
        try {
            const newImage = await api.uploadLandingImage(file, user.id); 
            setImages((prev) => [...prev, newImage]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to upload image');
            throw e;
        } finally {
            setIsUploading(false); // Set to false after upload
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

    return { images, isLoading, error, isUploading, uploadImage, deleteImage }; // FIX: Return isUploading
};