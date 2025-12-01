import React, { useState, useCallback } from 'react';
import { Upload, Trash2, Loader2, CheckCircle2, Image as ImageIcon, AlertTriangle, Users, Clock, ArrowLeft, Code, LogOut, ShieldOff } from 'lucide-react';
import { Button } from '../components/Button';
import { LandingImage, User, GeneratedImage } from '../types';
import { useLandingImages } from '../hooks/useLandingImages';
import { useAdminGeneratedImages } from '../hooks/useAdminGeneratedImages';
// import { api } from '../services/api'; // Removendo importação desnecessária

interface DevPanelPageProps {
  user: User | null; // User can be null if profile is still loading or not authenticated
  onBackToApp: () => void;
  onLogout: () => void;
}

// --- Image Upload Component (Reused) ---
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
    const { allImages, isLoadingAllImages, errorAllImages, deleteImage } = useAdminGeneratedImages(userRole);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    // Não precisamos mais de imagesWithSignedUrls ou isSigning
    const imagesToDisplay = allImages; 

    const handleDelete = useCallback(async (image: GeneratedImage) => {
        setDeletingId(image.id);
        setDeleteError(null);
        try {
            // O hook useAdminGeneratedImages agora extrai o path do storage a partir da URL pública
            await deleteImage(image.id, image.url); 
        } catch (e: any) {
            setDeleteError(e.message || "Falha ao deletar arte.");
        } finally {
            setDeletingId(null);
        }
    }, [deleteImage]);

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Users size={20} className="text-accent" /> Todas as Artes Geradas ({allImages.length})
            </h3>
            
            {isLoadingAllImages && (
                <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin mr-2" /> Carregando imagens...
                </div>
            )}
            
            {errorAllImages && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{String(errorAllImages)}</div>
            )}
            
            {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{deleteError}</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {imagesToDisplay.map((img: GeneratedImage) => (
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
            
            {imagesToDisplay.length === 0 && !isLoadingAllImages && !errorAllImages && (
                <p className="text-center text-gray-500 py-10">Nenhuma arte gerada ainda.</p>
            )}
        </div>
    );
};

// --- Componente de Gerenciamento de Imagens da Landing Page ---
const LandingImagesManager: React.FC<{ user: User }> = ({ user }) => {
    const { images, isLoading, error, uploadImage, deleteImage } = useLandingImages(user.role);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteLandingImage = useCallback(async (image: LandingImage) => {
        setDeletingId(image.id);
        setDeleteError(null);
        try {
            // CRITICAL FIX: O hook useLandingImages agora extrai o path do storage a partir da URL pública
            // O backend/routes/adminRoutes.cjs espera o 'imagePath' no corpo da requisição DELETE.
            // Precisamos extrair o path aqui para passar ao hook, que o passará ao backend.
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
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
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
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{String(error)}</div>
            )}
            
            {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{deleteError}</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img: LandingImage) => (
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
    );
};


// --- Main Dev Panel Page ---
export const DevPanelPage: React.FC<DevPanelPageProps> = ({ user, onBackToApp, onLogout }) => {
    // Conditional rendering for access control
    if (!user || (user.role !== 'admin' && user.role !== 'dev')) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-gray-100 p-4 text-center">
                <ShieldOff size={64} className="text-red-500 mb-6 opacity-50" />
                <h1 className="text-3xl font-bold text-white mb-3">Acesso Negado</h1>
                <p className="text-gray-400 mb-8">Você não tem permissão para acessar o Painel do Desenvolvedor.</p>
                <Button onClick={onBackToApp} icon={<ArrowLeft size={16} />}>
                    Voltar para o Aplicativo
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-gray-100 pt-20 pb-16 relative">
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
            
            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                
                {/* Header da Página */}
                <div className="flex items-center justify-between border-b border-primary/50 pb-4 mb-8">
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <Code size={28} className="text-primary" /> Painel do Desenvolvedor
                    </h1>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={onBackToApp} icon={<ArrowLeft size={16} />}>
                            Voltar para o App
                        </Button>
                        <Button variant="danger" onClick={onLogout} icon={<LogOut size={16} />}>
                            Logout
                        </Button>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Seção 1: Gerenciamento de Artes Geradas por Usuários */}
                    <GeneratedImagesManager userRole={user.role} />

                    {/* Seção 2: Gerenciamento de Imagens da Landing Page */}
                    <LandingImagesManager user={user} />
                </div>
            </div>
        </div>
    );
};