import React, { useState, useCallback, useEffect } from 'react';
import { Users, Clock, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../Button';
import { useAdminGeneratedImages } from '@/hooks/useAdminGeneratedImages';
import { GeneratedImage, User } from '@/types';
import { api } from '@/services/api';

export const GeneratedImagesManager: React.FC<{ userRole: User['role'] }> = ({ userRole }) => {
    const { allImages, isLoadingAllImages, errorAllImages, deleteImage } = useAdminGeneratedImages(userRole);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [imagesWithSignedUrls, setImagesWithSignedUrls] = useState<(GeneratedImage & { userId: string })[]>([]);
    const [isSigning, setIsSigning] = useState(false);

    const generateSignedUrls = useCallback(async (images: any[]) => {
        if (images.length === 0) return [];
        setIsSigning(true);
        
        const signedImages = await Promise.all(images.map(async (img: any) => {
            try {
                const signedUrl = await api.getDownloadUrl(img.image_url); 
                return {
                    id: img.id,
                    url: signedUrl,
                    prompt: img.prompt,
                    businessInfo: img.business_info,
                    createdAt: new Date(img.created_at).getTime(),
                    userId: img.user_id 
                } as GeneratedImage & { userId: string };
            } catch (e) {
                console.warn(`Falha ao gerar URL assinada para ${img.id}`);
                return null;
            }
        }));
        
        setIsSigning(false);
        return signedImages.filter((img: GeneratedImage & { userId: string } | null): img is GeneratedImage & { userId: string } => img !== null);
    }, []);

    useEffect(() => {
        if (allImages.length > 0) {
            generateSignedUrls(allImages).then(setImagesWithSignedUrls);
        } else {
            setImagesWithSignedUrls([]);
        }
    }, [allImages, generateSignedUrls]);

    const handleDelete = useCallback(async (image: GeneratedImage) => {
        setDeletingId(image.id);
        setDeleteError(null);
        try {
            const imageToDelete = allImages.find((img: GeneratedImage) => img.id === image.id);
            
            if (!imageToDelete) {
                throw new Error("Caminho do arquivo não encontrado no cache.");
            }
            
            await deleteImage(image.id, (imageToDelete as any).image_url); 
        } catch (e: any) {
            setDeleteError(e.message || "Falha ao deletar arte.");
        } finally {
            setDeletingId(null);
        }
    }, [allImages, deleteImage]);

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Users size={20} className="text-accent" /> Todas as Artes Geradas ({allImages.length})
            </h3>
            
            {(isLoadingAllImages || isSigning) && (
                <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin mr-2" /> Carregando e assinando URLs...
                </div>
            )}
            
            {errorAllImages && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{String(errorAllImages)}</div>
            )}
            
            {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{deleteError}</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {imagesWithSignedUrls.map((img: GeneratedImage & { userId: string }) => (
                    <div key={img.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 group bg-black">
                        <img src={img.url} alt="Arte Gerada" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                            <p className="text-[8px] text-gray-400 truncate mb-1 flex items-center gap-1">
                                <Clock size={8} /> {new Date(img.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-white font-medium truncate mb-2">{img.businessInfo.companyName}</p>
                            <Button 
                                variant="danger" 
                                onClick={() => handleDelete(img)}
                                isLoading={deletingId === img.id}
                                className="h-8 px-2 text-xs w-full"
                                icon={<Trash2 size={14} />}
                            >
                                Deletar
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            
            {allImages.length === 0 && !isLoadingAllImages && !errorAllImages && (
                <p className="text-center text-gray-500 py-10">Nenhuma arte gerada ainda.</p>
            )}
        </div>
    );
};