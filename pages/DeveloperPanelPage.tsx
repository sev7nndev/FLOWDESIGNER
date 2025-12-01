import React, { useState, useRef } from 'react';
import { User, LandingImage } from '../types';
import { ArrowLeft, Upload, Trash2, Loader2, Image as ImageIcon, XCircle, LogOut, Code, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { useLandingImages } from '../hooks/useLandingImages';

interface DeveloperPanelPageProps {
  user: User | null;
  onBackToApp: () => void;
  onLogout: () => void;
}

// --- Componente de Gerenciamento de Imagens ---
interface ImageManagerProps {
    user: User;
}

const ImageManager: React.FC<ImageManagerProps> = ({ user }) => {
    const { images, isLoading, error, isUploading, uploadImage, deleteImage } = useLandingImages(user);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError("Por favor, selecione um arquivo de imagem válido.");
            return;
        }

        try {
            await uploadImage(file);
            // Limpa o input após o sucesso
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (e: any) {
            // O erro já foi setado no hook, mas podemos garantir a mensagem aqui
            setUploadError(e.message || "Falha no upload. Verifique o console.");
        }
    };

    const handleDelete = async (id: string, imagePath: string) => {
        if (window.confirm("Tem certeza que deseja deletar esta imagem?")) {
            try {
                await deleteImage(id, imagePath);
            } catch (e: any) {
                alert(e.message || "Falha ao deletar a imagem.");
            }
        }
    };

    return (
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-primary" /> Imagens da Landing Page
            </h3>
            <p className="text-sm text-gray-400 mb-6">
                Gerencie as imagens que aparecem no carrossel da página inicial pública.
            </p>

            {/* Upload Area */}
            <div className="mb-6 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-zinc-800/50">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                />
                <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full justify-center"
                >
                    {isUploading ? (
                        <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                        <Upload size={16} className="mr-2" />
                    )}
                    {isUploading ? 'Enviando...' : 'Selecionar e Enviar Nova Imagem'}
                </Button>
                {uploadError && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                        <XCircle size={14} /> {uploadError}
                    </p>
                )}
            </div>

            {/* Image Gallery */}
            {isLoading ? (
                <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin mr-2" /> Carregando galeria...
                </div>
            ) : images.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Nenhuma imagem na galeria. Faça o primeiro upload!</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image: LandingImage) => (
                        <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden shadow-xl border border-white/10">
                            <img 
                                src={image.url} 
                                alt={`Landing Image ${image.id}`} 
                                className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-70"
                            />
                            <button
                                onClick={() => handleDelete(image.id, image.image_path)}
                                className="absolute top-2 right-2 p-2 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700"
                                title="Deletar Imagem"
                            >
                                <Trash2 size={16} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                ID: {image.id.substring(0, 4)}...
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={18} /> {error}
                </div>
            )}
        </div>
    );
};


// --- Main Developer Panel Page ---
export const DeveloperPanelPage: React.FC<DeveloperPanelPageProps> = ({ user, onBackToApp, onLogout }) => {
    // Conditional rendering for access control
    if (!user || user.role !== 'dev') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-gray-100 p-4 text-center">
                <AlertTriangle size={64} className="text-red-500 mb-6 opacity-50" />
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
                
                {/* Conteúdo do Painel */}
                <div className="space-y-10">
                    <ImageManager user={user} />
                    
                    {/* Outras Ferramentas de Dev (Placeholder) */}
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 shadow-lg">
                        <h3 className="text-xl font-bold text-white mb-4">Ferramentas de Debug</h3>
                        <p className="text-gray-400">
                            Aqui você pode adicionar ferramentas como logs de erro, monitoramento de API, e gerenciamento de variáveis de ambiente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};