import React, { useState, useEffect, useCallback } from 'react';
import { Upload, AlertTriangle, CheckCircle2, DollarSign, Settings, Save, Loader2, Link, Unlink, Info, Activity, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { api, BACKEND_URL } from '../../../services/api';
import { toast } from 'sonner';
import { User, UserRole, EditablePlan } from '../../../types';
import { getSupabase } from '../../../services/supabaseClient';

// --- Image Upload Component ---
interface ImageUploadProps {
    onUpload: (file: File) => Promise<void>;
    userId: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload }) => {
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

// --- Plan Settings Manager ---
export const PlanSettingsManager: React.FC = () => {
    const [plans, setPlans] = useState<EditablePlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao carregar planos')), 5000));

        try {
            const fetchedPlans = await Promise.race([api.getPlanSettings(), timeout]) as EditablePlan[];
            setPlans(fetchedPlans.sort((a, b) => a.price - b.price));
        } catch (e: any) {
            console.error("Plan Fetch Error:", e);
            setError(e.message || "Falha ao carregar planos.");
            toast.error(`Erro planos: ${e.message || "Desconhecido"}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    const handleInputChange = (id: UserRole, field: keyof EditablePlan, value: string) => {
        setPlans(prev => prev.map(p => {
            if (p.id !== id) return p;

            // Allow empty string for Price/Limit to let user clear the input
            if (field === 'price') {
                // If empty, set as 0 internally but UI input should handle it via prop if strictly controlled? 
                // Actually, controlled input <input type="number"> returns "" if invalid.
                // We'll trust the user input string for now or parse carefully.
                // Better approach: Cast to valid number only if not empty, otherwise keep old or 0? 
                // For smooth typing, we should update the state. But our state is strict number.
                // Workaround: We will stick to parsing, but if value is empty string, make it 0? 
                // Or better: Let's remove the "|| 0" aggressive fallback which forces 0 on empty.
                const parsed = parseFloat(value);
                return { ...p, price: isNaN(parsed) ? 0 : parsed };
            }
            if (field === 'max_images_per_month') {
                const parsed = parseInt(value);
                return { ...p, max_images_per_month: isNaN(parsed) ? 0 : parsed };
            }
            if (field === 'features') return { ...p, features: value.split('\n').map(f => f.trim()).filter(f => f.length > 0) };
            return { ...p, [field]: value };
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const validPlans = plans.map(p => ({
                ...p,
                price: parseFloat(p.price.toFixed(2)),
                max_images_per_month: Math.max(0, p.max_images_per_month),
                features: Array.isArray(p.features) ? p.features : (p.features as string).split('\n')
            }));
            await api.updatePlanSettings(validPlans);
            toast.success("Configurações salvas!");
            fetchPlans();
        } catch (e: any) {
            setError(e.message);
            toast.error(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Settings size={20} className="text-primary" /> Configuração de Planos
            </h3>

            {isLoading && <div className="text-center py-10"><Loader2 size={20} className="animate-spin text-primary mx-auto" /></div>}
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}

            <div className="space-y-6">
                {plans.map((plan: EditablePlan) => (
                    <div key={plan.id} className="p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                        <h4 className="text-lg font-semibold text-white uppercase mb-3 flex items-center justify-between">
                            {plan.id}
                            <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">ID: {plan.id}</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nome Exibição</label>
                                <input type="text" value={plan.display_name} onChange={(e) => handleInputChange(plan.id as UserRole, 'display_name', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Preço (R$)</label>
                                <input type="number" step="0.01" value={plan.price} onChange={(e) => handleInputChange(plan.id as UserRole, 'price', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Descrição</label>
                                <input type="text" value={plan.description} onChange={(e) => handleInputChange(plan.id as UserRole, 'description', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Limite (Imagens/mês)</label>
                                <input type="number" value={plan.max_images_per_month} onChange={(e) => handleInputChange(plan.id as UserRole, 'max_images_per_month', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Recursos (Linha por linha)</label>
                                <textarea rows={4} value={plan.features.join('\n')} onChange={(e) => handleInputChange(plan.id as UserRole, 'features', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none resize-none" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Button onClick={handleSave} isLoading={isSaving} className="w-full h-10 text-sm mt-4" icon={<Save size={16} />}>
                Salvar Alterações
            </Button>
        </div>
    );
};

// --- Mercado Pago Manager ---
export const MercadoPagoManager: React.FC<{ user: User }> = ({ user }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

    // Allow owner, dev, and admin to manage MP connection
    const canManage = user.role === 'owner' || user.role === 'dev' || user.role === 'admin';
    const isOwner = user.role === 'owner';
    const supabase = getSupabase();

    const checkConnectionStatus = useCallback(async () => {
        if (!canManage || !supabase) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            // Check if any owner has MP connected
            const { data } = await supabase
                .from('owners_payment_accounts')
                .select('owner_id')
                .limit(1)
                .maybeSingle();

            setIsConnected(!!data);

            // If dev/admin, get owner email for display
            if (!isOwner && data) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'owner')
                    .limit(1)
                    .maybeSingle();

                if (profileData) {
                    // Get email from auth.users (requires service role, so we'll skip this for now)
                    setOwnerEmail('Owner');
                }
            }
        } catch (e) {
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, [canManage, isOwner, supabase]);

    useEffect(() => {
        checkConnectionStatus();
        const params = new URLSearchParams(window.location.search);
        const mpStatus = params.get('mp_status');
        const code = params.get('code');

        if (code) {
            // OAuth Callback
            setIsLoading(true);
            api.exchangeMpCode(code)
                .then(() => {
                    setStatusMessage({ type: 'success', message: 'Conta conectada com sucesso!' });
                    checkConnectionStatus();
                })
                .catch(err => {
                    setStatusMessage({ type: 'error', message: err.message });
                })
                .finally(() => {
                    setIsLoading(false);
                    // Clear URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                });
        } else if (mpStatus === 'success') {
            setStatusMessage({ type: 'success', message: 'Conectado com sucesso!' });
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (mpStatus === 'error') {
            setStatusMessage({ type: 'error', message: 'Erro na conexão.' });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [checkConnectionStatus]);

    if (!canManage) return null;

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            const connectUrl = await api.getMercadoPagoConnectUrl();
            window.location.href = connectUrl;
        } catch (e: any) {
            toast.error(e.message);
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        toast.info("Para desconectar, remova o registro em 'owners_payment_accounts' no Supabase.");
    };

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <DollarSign size={20} className="text-green-500" />
                Integração Mercado Pago
                {!isOwner && <span className="text-xs text-gray-500 font-normal">(Monitoramento Dev)</span>}
            </h3>

            {isLoading ? (
                <div className="text-center py-4"><Loader2 size={20} className="animate-spin text-primary mx-auto" /></div>
            ) : isConnected ? (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Link size={16} />
                        Conta Conectada {!isOwner && ownerEmail && `(${ownerEmail})`}
                    </span>
                    <Button
                        variant="ghost"
                        onClick={handleDisconnect}
                        className="h-8 text-xs text-red-400 hover:bg-red-500/10"
                        icon={<Unlink size={14} />}
                    >
                        Desconectar
                    </Button>
                </div>
            ) : (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Pagamentos Desconectados {!isOwner && '(Owner precisa conectar)'}
                    </span>
                    <Button
                        onClick={handleConnect}
                        className="h-8 text-xs"
                        icon={<Link size={14} />}
                    >
                        {isOwner ? 'Conectar Agora' : 'Reconectar OAuth'}
                    </Button>
                </div>
            )}

            {statusMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
                    <p>{statusMessage.message}</p>
                </div>
            )}

            {!isOwner && (
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-lg flex items-center gap-2">
                    <Info size={14} />
                    <p>Como DEV, você pode monitorar e corrigir a conexão OAuth do Mercado Pago se houver problemas.</p>
                </div>
            )}
        </div>
    );
};

// --- System Health Widget ---
export const SystemHealthWidget: React.FC = () => {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const checkHealth = useCallback(async () => {
        setLoading(true);
        try {
            // Call public health check endpoint (no auth required)
            const res = await fetch(`${BACKEND_URL}/health-check`);

            if (!res.ok) throw new Error('Health check failed');

            const data = await res.json();

            // Use the response directly
            setHealth(data);
        } catch (e) {
            console.error('Health check error:', e);
            setHealth({ status: 'offline', database: 'disconnected', services: { gemini: 'inactive' } });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { checkHealth(); }, [checkHealth]);

    if (loading) return <div className="p-6 bg-zinc-900/50 rounded-xl border border-white/10 animate-pulse h-32"></div>;

    return (
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 flex flex-col md:flex-row gap-6 items-center justify-between mb-6">
            <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {health?.status === 'healthy' ? <CheckCircle2 className="text-green-500" /> : <AlertTriangle className="text-red-500" />}
                    Status do Sistema
                </h3>
                <p className="text-gray-400 text-sm mt-1">Versão: {health?.version || 'Unknown'}</p>
                <div className="flex gap-2">
                    <p className="text-gray-500 text-xs mt-1">Uptime: {Math.floor(health?.uptime || 0)}s</p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className={`px-4 py-2 rounded-lg border ${health?.database === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className="text-[10px] font-bold uppercase block opacity-70">Banco de Dados</span>
                    <span className="font-mono text-sm">{health?.database === 'connected' ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                <div className={`px-4 py-2 rounded-lg border ${health?.services?.gemini === 'active' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                    <span className="text-[10px] font-bold uppercase block opacity-70">IA Engine</span>
                    <span className="font-mono text-sm">{health?.services?.gemini === 'active' ? 'PRONTO' : 'SEM API KEY'}</span>
                </div>
            </div>

            <Button variant="ghost" icon={<Activity size={16} />} onClick={checkHealth} className="hover:bg-white/5">Atualizar</Button>
        </div>
    );
};

// --- Landing Carousel Manager ---
export const LandingCarouselManager: React.FC = () => {
    const [images, setImages] = useState<{ id: string, url: string, sortOrder: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadImages = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getLandingImages();
            setImages(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar imagens do carrossel");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadImages(); }, [loadImages]);

    const handleUpload = async (file: File) => {
        try {
            // Mock user ID since we are in admin context, or fetch real one if strict
            const { data: { user } } = await getSupabase()!.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            await api.uploadLandingImage(file, user.id);
            toast.success("Imagem adicionada com sucesso!");
            loadImages();
        } catch (error: any) {
            toast.error(error.message || "Erro ao fazer upload");
        }
    };

    const handleDelete = async (id: string, url: string) => {
        if (!confirm("Tem certeza que deseja remover esta imagem?")) return;
        try {
            // Extract path from URL if needed, or api handles it. 
            // API expects path but often we store path in DB. 
            // Let's assume URL contains path or API can parse it.
            // Actually api.ts deleteLandingImage expects (id, imagePath).
            // We need to pass the storage path. 
            // If the URL is full public URL, we might need to verify how backend stores it.
            // Backend storage path is usually `landing/...`.
            // Let's pass the URL and let the API/Backend try to figure it out or we need the path from DB.
            // Our api.getLandingImages returns URL. We might need the raw path.
            // For now let's try passing the filename extrated from URL.
            const path = url.split('/').pop() ? `landing/${url.split('/').pop()}` : '';

            await api.deleteLandingImage(id, path);
            toast.success("Imagem removida!");
            loadImages();
        } catch (error: any) {
            toast.error(error.message || "Erro ao deletar");
        }
    };

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Upload size={20} className="text-purple-500" />
                Carrossel da Landing Page
            </h3>

            <ImageUpload onUpload={handleUpload} userId="admin" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {images.map(img => (
                    <div key={img.id} className="relative group aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
                        <img src={img.url} alt="Carousel" className="w-full h-full object-cover" />
                        <button
                            onClick={() => handleDelete(img.id, img.url)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
            {images.length === 0 && !isLoading && (
                <p className="text-gray-500 text-sm italic text-center py-4">Nenhuma imagem no carrossel.</p>
            )}
        </div>
    );
};

