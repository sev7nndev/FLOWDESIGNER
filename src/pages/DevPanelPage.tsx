import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Loader2, CheckCircle2, Image as ImageIcon, AlertTriangle, Users, Clock, ArrowLeft, Code, LogOut, ShieldOff, Settings, DollarSign, Link, Unlink, Save, Info } from 'lucide-react';
import { Button } from '../../components/Button';
import { LandingImage, User, GeneratedImage, UserRole, EditablePlan } from '../../types';
import { useLandingImages } from '../../hooks/useLandingImages';
import { useAdminGeneratedImages } from '../../hooks/useAdminGeneratedImages';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { getSupabase } from '../../services/supabaseClient';

interface DevPanelPageProps {
  user: User | null;
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
    const [imagesWithSignedUrls, setImagesWithSignedUrls] = useState<(GeneratedImage & { userId: string })[]>([]);
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
                    userId: img.user_id 
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
            const path = (allImages.find((img: GeneratedImage) => img.id === image.id) as any)?.image_url;
            
            if (!path) {
                throw new Error("Caminho do arquivo não encontrado no cache.");
            }
            
            await deleteImage(image.id, path);
            setImagesWithSignedUrls((prev: (GeneratedImage & { userId: string })[]) => prev.filter((img: GeneratedImage & { userId: string }) => img.id !== image.id));
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

// --- Componente de Gerenciamento de Imagens da Landing Page ---
const LandingImagesManager: React.FC<{ user: User }> = ({ user }) => {
    const { images, isLoading, error, uploadImage, deleteImage } = useLandingImages(user.role);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteLandingImage = useCallback(async (image: LandingImage) => {
        setDeletingId(image.id);
        setDeleteError(null);
        try {
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

// --- Componente de Gerenciamento de Planos (Apenas Dev) ---
const PlanSettingsManager: React.FC = () => {
    const [plans, setPlans] = useState<EditablePlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedPlans = await api.getPlanSettings();
            // Sort by price for consistent display
            setPlans(fetchedPlans.sort((a: EditablePlan, b: EditablePlan) => a.price - b.price));
        } catch (e: any) {
            setError(e.message || "Falha ao carregar planos.");
            toast.error("Falha ao carregar planos.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleInputChange = (id: UserRole, field: keyof EditablePlan, value: string) => {
        setPlans(prev => prev.map(p => {
            if (p.id !== id) return p;
            
            if (field === 'price') {
                return { ...p, price: parseFloat(value) || 0 };
            }
            if (field === 'max_images_per_month') {
                return { ...p, max_images_per_month: parseInt(value) || 0 };
            }
            if (field === 'features') {
                // Convert textarea content (newline separated) back to string array
                return { ...p, features: value.split('\n').map(f => f.trim()).filter(f => f.length > 0) };
            }
            
            return { ...p, [field]: value };
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            // Validate data before sending
            const validPlans = plans.map(p => ({
                ...p,
                price: parseFloat(p.price.toFixed(2)),
                max_images_per_month: Math.max(0, p.max_images_per_month),
                // Ensure features is an array of strings
                features: Array.isArray(p.features) ? p.features : (p.features as string).split('\n').map(f => f.trim()).filter(f => f.length > 0)
            }));
            
            await api.updatePlanSettings(validPlans);
            toast.success("Configurações de planos salvas com sucesso!");
            fetchPlans(); // Refresh data
        } catch (e: any) {
            setError(e.message || "Falha ao salvar configurações.");
            toast.error(e.message || "Falha ao salvar configurações.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Settings size={20} className="text-primary" /> Configuração de Planos (Dev)
            </h3>
            
            {isLoading && <div className="text-center py-10"><Loader2 size={20} className="animate-spin text-primary" /></div>}
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}

            <div className="space-y-6">
                {plans.map((plan: EditablePlan) => (
                    <div key={plan.id} className="p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                        <h4 className="text-lg font-semibold text-white uppercase mb-3">{plan.id}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Display Name */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome de Exibição</label>
                                <input 
                                    type="text" 
                                    value={plan.display_name}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'display_name', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            {/* Price */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Preço (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={plan.price}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'price', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Descrição Curta</label>
                                <input 
                                    type="text" 
                                    value={plan.description}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'description', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            {/* Max Images */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Limite Mensal (Imagens)</label>
                                <input 
                                    type="number" 
                                    value={plan.max_images_per_month}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'max_images_per_month', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            {/* Features (Textarea) */}
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Recursos (Um por linha)</label>
                                <textarea 
                                    rows={4}
                                    value={plan.features.join('\n')}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'features', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <Button onClick={handleSave} isLoading={isSaving} className="w-full h-10 text-sm mt-4" icon={<Save size={16} />}>
                Salvar Configurações de Planos
            </Button>
        </div>
    );
};

// --- Componente de Conexão Mercado Pago (Apenas Dono do SaaS) ---
const MercadoPagoManager: React.FC<{ user: User }> = ({ user }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    // Restrição de acesso: Apenas 'owner' pode ver e interagir com esta seção.
    const isOwner = user.role === 'owner';
    const supabase = getSupabase();
    
    // Check connection status (simplified: just check if tokens exist)
    const checkConnectionStatus = useCallback(async () => {
        if (!isOwner || !supabase) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            // This endpoint is only accessible by admin/dev via service key in the backend
            const { data } = await supabase
                .from('owners_payment_accounts')
                .select('owner_id')
                .limit(1)
                .maybeSingle();
                
            setIsConnected(!!data);
        } catch (e: any) {
            console.error("Failed to check MP connection status:", e);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, [isOwner, supabase]);
    
    useEffect(() => {
        checkConnectionStatus();
        
        // Check URL for OAuth callback status
        const params = new URLSearchParams(window.location.search);
        const mpStatus = params.get('mp_status');
        const message = params.get('message');
        
        if (mpStatus === 'success') {
            setStatusMessage({ type: 'success', message: 'Conexão com Mercado Pago realizada com sucesso!' });
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (mpStatus === 'error') {
            setStatusMessage({ type: 'error', message: message || 'Falha na conexão com Mercado Pago.' });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [checkConnectionStatus]);
    
    if (!isOwner) {
        return null; // Não renderiza nada se não for o owner
    }
    
    const handleConnect = () => {
        window.location.href = api.getMercadoPagoConnectUrl();
    };
    
    const handleDisconnect = () => {
        // NOTE: Disconnecting requires a backend endpoint to delete tokens, 
        // which is not explicitly requested but necessary for a full flow.
        // For now, we simulate the action and rely on the dev to manually delete the row if needed.
        toast.info("Para desconectar, remova manualmente o registro na tabela 'owners_payment_accounts' no Supabase.");
    };

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <DollarSign size={20} className="text-green-500" /> Integração Mercado Pago (Dono do SaaS)
            </h3>
            
            {isLoading ? (
                <div className="text-center py-4"><Loader2 size={20} className="animate-spin text-primary" /></div>
            ) : isConnected ? (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-2"><Link size={16} /> Conectado e pronto para receber pagamentos.</span>
                    <Button variant="ghost" onClick={handleDisconnect} className="h-8 text-xs text-red-400 hover:bg-red-500/10" icon={<Unlink size={14} />}>
                        Desconectar
                    </Button>
                </div>
            ) : (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-2"><AlertTriangle size={16} /> Desconectado. Conecte para receber pagamentos Starter/Pro.</span>
                    <Button onClick={handleConnect} className="h-8 text-xs" icon={<Link size={14} />}>
                        Conectar Mercado Pago
                    </Button>
                </div>
            )}
            
            {statusMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    statusMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
                    <p>{statusMessage.message}</p>
                </div>
            )}
        </div>
    );
};


// --- Main Dev Panel Page ---
export const DevPanelPage: React.FC<DevPanelPageProps> = ({ user, onBackToApp, onLogout }) => {
    // Conditional rendering for access control
    if (!user || (user.role !== 'admin' && user.role !== 'dev' && user.role !== 'owner')) {
        return (
            <div className="app-container min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-gray-100 p-4 text-center">
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
        <div className="app-container min-h-screen bg-zinc-950 text-gray-100 pt-20 pb-16 relative overflow-x-hidden">
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
                    {/* Seção 0: Gerenciamento de Pagamentos (Apenas Owner) */}
                    {user && <MercadoPagoManager user={user} />}
                    
                    {/* Seção 1: Gerenciamento de Planos */}
                    <PlanSettingsManager />

                    {/* Seção 2: Gerenciamento de Artes Geradas por Usuários */}
                    <GeneratedImagesManager userRole={user.role} />

                    {/* Seção 3: Gerenciamento de Imagens da Landing Page */}
                    <LandingImagesManager user={user} />
                </div>
            </div>
        </div>
    );
};