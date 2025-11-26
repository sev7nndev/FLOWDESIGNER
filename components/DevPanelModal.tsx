import React, { useState, useCallback, useEffect } from 'react';
import { X, Upload, Trash2, Loader2, CheckCircle2, Image as ImageIcon, AlertTriangle, Users, Clock } from 'lucide-react';
import { Button } from './Button';
import { LandingImage, User, GeneratedImage } from '../types';
import { useLandingImages } from '../hooks/useLandingImages';
import { useAdminGeneratedImages } from '../hooks/useAdminGeneratedImages';
import { api } from '../services/api'; // Importar API para download

interface DevPanelModalProps {
  onClose: () => void;
  user: User;
}

// --- Generic Modal Wrapper (Reused from Modals.tsx, but defined here for simplicity) ---
interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900 z-10 sticky top-0">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto p-6 custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

// --- Image Upload Component ---
interface ImageUploadProps {
    onUpload: (file: File) => Promise<void>;
    userId: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith('image/')) {
                setUploadError("Apenas arquivos de imagem são permitidos.");
                setFile(null);
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                setUploadError("O arquivo é muito grande (Máx: 5MB).");
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setUploadError(null);
            setUploadSuccess(false);
        }
    };

    const handleUpload = useCallback(async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);
        try {
            await onUpload(file);
            setUploadSuccess(true);
            setFile(null);
            if (document.getElementById('file-upload')) {
                (document.getElementById('file-upload') as HTMLInputElement).value = '';
            }
        } catch (e: any) {
            setUploadError(e.message || "Falha no upload.");
        } finally {
            setIsUploading(false);
        }
    }, [file, onUpload]);

    return (
        <div className="p-4 border border-white/10 rounded-xl bg-zinc-800/50 space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
                <Upload size={18} className="text-primary" /> Upload de Nova Imagem
            </h4>
            <input 
                type="file" 
                id="file-upload"
                accept="image/*" 
                onChange={handleFileChange} 
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            
            {file && (
                <p className="text-xs text-gray-400">Arquivo selecionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
            )}

            {uploadError && (
                <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={14} /> {uploadError}</p>
            )}
            
            {uploadSuccess && (
                <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 size={14} /> Upload realizado com sucesso!</p>
            )}

            <Button 
                onClick={handleUpload} 
                isLoading={isUploading} 
                disabled={!file || isUploading}
                className="w-full h-10 text-sm"
            >
                {isUploading ? 'Enviando...' : 'Confirmar Upload'}
            </Button>
        </div>
    );
};

// --- Componente de Gerenciamento de Imagens Geradas ---
const GeneratedImagesManager: React.FC<{ userRole: User['role'] }> = ({ userRole }) => {
    const { allImages, isLoadingAllImages, errorAllImages, fetchAllImages, deleteImage } = useAdminGeneratedImages(userRole);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [imagesWithSignedUrls, setImagesWithSignedUrls] = useState<GeneratedImage[]>([]);
    const [isSigning, setIsSigning] = useState(false);

    // Função para gerar URLs assinadas para todas as imagens
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
                    userId: img.user_id // Adicionando userId para referência
                } as GeneratedImage & { userId: string };
            } catch (e) {
                console.warn(`Falha ao gerar URL assinada para ${img.id}`);
                return null;
            }
        }));
        
        setIsSigning(false);
        return signedImages.filter((img): img is GeneratedImage & { userId: string } => img !== null);
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
            // A URL da imagem gerada é o path do storage (ex: user_id/mock-timestamp.png)
            // O backend espera o path completo (image.url no DB)
            const path = (allImages.find(img => img.id === image.id) as any)?.image_url;
            
            if (!path) {
                throw new Error("Caminho do arquivo não encontrado no cache.");
            }
            
            await deleteImage(image.id, path);
            // Atualiza o estado local após a exclusão
            setImagesWithSignedUrls(prev => prev.filter(img => img.id !== image.id));
        } catch (e: any) {
            setDeleteError(e.message || "Falha ao deletar arte.");
        } finally {
            setDeletingId(null);
        }
    }, [allImages, deleteImage]);

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Users size={20} className="text-accent" /> Todas as Artes Geradas ({allImages.length})
            </h3>
            
            {(isLoadingAllImages || isSigning) && (
                <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin mr-2" /> Carregando e assinando URLs...
                </div>
            )}
            
            {errorAllImages && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{errorAllImages}</div>
            )}
            
            {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{deleteError}</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {imagesWithSignedUrls.map((img) => (
                    <div key={img.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 group bg-black">
                        <img src={img.url} alt="Arte Gerada" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Overlay de Ação */}
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


// --- Main Dev Panel Modal ---
export const DevPanelModal: React.FC<DevPanelModalProps> = ({ onClose, user }) => {
    const { images, isLoading, error, uploadImage, deleteImage } = useLandingImages(user.role);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteLandingImage = useCallback(async (image: LandingImage) => {
        setDeletingId(image.id);
        setDeleteError(null);
        try {
            // A URL pública é: [SUPABASE_URL]/storage/v1/object/public/landing-carousel/[path]
            // Precisamos extrair o [path]
            const urlParts = image.url.split('/landing-carousel/');
            const path = urlParts.length > 1 ? urlParts[1] : '';
            
            if (!path) {
                throw new Error("Caminho do arquivo inválido.");
            }
            
            await deleteImage(image.id, path);
        } catch (e: any) {
            setDeleteError(e.message || "Falha ao deletar imagem.");
        } finally {
            setDeletingId(null);
        }
    }, [deleteImage]);

    const handleUploadWrapper = useCallback(async (file: File) => {
        await uploadImage(file, user.id);
    }, [uploadImage, user.id]);

    return (
        <ModalWrapper title="Painel do Desenvolvedor (Admin/Dev)" onClose={onClose}>
            <div className="space-y-10">
                
                {/* Seção 1: Gerenciamento de Artes Geradas por Usuários */}
                <GeneratedImagesManager userRole={user.role} />

                {/* Seção 2: Gerenciamento de Imagens da Landing Page */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                        <ImageIcon size={20} className="text-secondary" /> Imagens Atuais do Carrossel ({images.length})
                    </h3>
                    
                    {/* Upload Section */}
                    <ImageUpload onUpload={handleUploadWrapper} userId={user.id} />

                    {isLoading && (
                        <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
                        </div>
                    )}
                    
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>
                    )}
                    
                    {deleteError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{deleteError}</div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((img) => (
                            <div key={img.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 group">
                                <img src={img.url} alt="Carousel Asset" className="w-full h-full object-cover" />
                                
                                {/* Delete Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button 
                                        variant="danger" 
                                        onClick={() => handleDeleteLandingImage(img)}
                                        isLoading={deletingId === img.id}
                                        className="h-10 px-4 text-xs"
                                        icon={<Trash2 size={16} />}
                                    >
                                        Deletar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {images.length === 0 && !isLoading && !error && (
                        <p className="text-center text-gray-500 py-10">Nenhuma imagem no carrossel. Faça upload de algumas!</p>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
};