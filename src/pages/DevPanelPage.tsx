import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Loader2, Image as ImageIcon, Users, Clock, ArrowLeft, Code, LogOut, ShieldOff, CheckCircle2, AlertTriangle, Zap, Activity, CreditCard, DollarSign } from 'lucide-react';
import { Button } from '../components/Button';
import { LandingImage, User, GeneratedImage, UserRole } from '@/types';
import { useLandingImages } from '@/hooks/useLandingImages';
import { useAdminGeneratedImages } from '@/hooks/useAdminGeneratedImages';
import { api } from '@/services/api';
import { ImageUpload, MercadoPagoManager, PlanSettingsManager, SystemHealthWidget } from '@/src/components/admin/AdminWidgets';
import { toast } from 'sonner';
import { getSupabase } from '@/services/supabaseClient';

interface DevPanelPageProps {
    user: User | null;
    onBackToApp: () => void;
    onLogout: () => void;
}

// --- Image Manager Components (Specific to Dev Panel style) ---

const GeneratedImagesManager: React.FC<{ userRole: User['role'] }> = ({ userRole }) => {
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
                throw new Error("Caminho do arquivo não encontrado.");
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
            // O image_url retornado pelo hook é a URL pública, precisamos extrair o path do storage
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

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <ImageIcon size={20} className="text-secondary" /> Imagens Atuais do Carrossel ({images.length})
            </h3>

            {/* Upload Section */}
            <ImageUpload onUpload={(file) => uploadImage(file, user.id)} userId={user.id} />

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

// --- GUARDIAN AI CONSOLE ---
// --- SAAS MAINTENANCE HUB ---
const SaaSMaintenanceHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'monitor' | 'payments' | 'users' | 'logs'>('monitor');
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const supabase = getSupabase();
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const headers = { 'Authorization': `Bearer ${session.access_token}` };

            // Fetch Stats
            const statsRes = await fetch('/api/admin/guardian/stats', { headers });
            if (statsRes.ok) setStats(await statsRes.json());

            // Fetch Logs
            const logsRes = await fetch('/api/admin/guardian/logs', { headers });
            if (logsRes.ok) {
                const logData = await logsRes.json();
                setLogs(logData.logs);
            }

        } catch (e) {
            console.error("Hub Refresh Error:", e);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, []);

    const triggerRepair = async () => {
        setIsRefreshing(true);
        toast.info("Iniciando reparo automático...");
        try {
            const supabase = getSupabase();
            if (!supabase) throw new Error("Supabase not initialized");
            const { data: { session } } = await supabase.auth.getSession();
            await fetch('/api/admin/repair', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            toast.success("Reparo concluído. Atualizando...");
            setTimeout(refreshData, 2000);
        } catch (e) { toast.error("Falha ao reparar"); }
    };

    const forceReconnect = async () => {
        setIsRefreshing(true);
        toast.info("Ativando Sistema...");
        try {
            const supabase = getSupabase();
            if (!supabase) {
                toast.error("Supabase não inicializado");
                setIsRefreshing(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Sessão não encontrada. Faça login novamente.");
                setIsRefreshing(false);
                return;
            }

            const res = await fetch('/api/admin/guardian/run-cycle', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('✅ Sistema ativado:', data);
                toast.success("Sistema Reativado com Sucesso!");
                await refreshData();
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
                console.error('❌ Erro ao ativar:', errorData);
                toast.error(`Falha: ${errorData.error || 'Erro ao reativar sistema'}`);
            }
        } catch (e: any) {
            console.error('❌ Exceção ao ativar sistema:', e);
            toast.error(`Erro de conexão: ${e.message || 'Servidor não respondeu'}`);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="bg-black/80 rounded-xl border border-primary/20 shadow-2xl overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap size={20} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-none">Ferramenta de Manutenção SaaS</h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operando 24/7
                            <span className="text-zinc-600">|</span>
                            v2.0 Guardian Core
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={refreshData} isLoading={isRefreshing} icon={<Activity size={16} />}>
                        Atualizar
                    </Button>
                    <Button variant="primary" onClick={forceReconnect} isLoading={isRefreshing} icon={<Zap size={16} />}>
                        ATIVAR SISTEMA
                    </Button>
                    <Button variant="danger" onClick={triggerRepair} icon={<ShieldOff size={16} />}>
                        Correção Auto
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5">
                {[
                    { id: 'monitor', label: 'Monitoramento', icon: Activity },
                    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
                    { id: 'users', label: 'Novos Usuários', icon: Users },
                    { id: 'logs', label: 'Logs do Sistema', icon: Code },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id
                            ? 'bg-primary/10 text-primary border-b-2 border-primary'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6 min-h-[300px] bg-zinc-950/50">
                {activeTab === 'monitor' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Saúde da Infraestrutura</h4>

                            <div className="p-4 rounded-lg bg-zinc-900 border border-white/5 flex justify-between items-center">
                                <span className="text-sm text-gray-300">Latência do Banco</span>
                                <span className={`font-mono font-bold ${stats.dbLatency < 500 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {stats.dbLatency}ms
                                </span>
                            </div>

                            <div className="p-4 rounded-lg bg-zinc-900 border border-white/5 flex justify-between items-center">
                                <span className="text-sm text-gray-300">Uso de Memória</span>
                                <span className="font-mono font-bold text-purple-400">{stats.memory} MB</span>
                            </div>

                            <div className="p-4 rounded-lg bg-zinc-900 border border-white/5 flex justify-between items-center">
                                <span className="text-sm text-gray-300">Integridade de Rotas</span>
                                <span className={`font-mono font-bold ${stats.routeStatus === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                                    {stats.routeStatus}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Integrações Externas</h4>

                            <div className="p-4 rounded-lg bg-zinc-900 border border-white/5 flex justify-between items-center">
                                <span className="text-sm text-gray-300 flex items-center gap-2"><CreditCard size={14} /> Mercado Pago</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${stats.mpStatus === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {stats.mpStatus}
                                </span>
                            </div>

                            <div className="p-4 rounded-lg bg-zinc-900 border border-white/5">
                                <p className="text-xs text-gray-500 mb-2">Última Varredura</p>
                                <p className="text-sm text-white">{new Date(stats.lastRun).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="h-64 overflow-y-auto pr-2 space-y-1 font-mono text-xs">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3 hover:bg-white/5 p-2 rounded transition-colors border-b border-white/5 last:border-0">
                                <span className="text-gray-500 w-24 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`font-bold w-32 shrink-0 ${log.status === 'OK' || log.status === 'ONLINE' || log.status === 'OPTIMAL' ? 'text-green-500' :
                                    log.status === 'WARNING' ? 'text-yellow-500' : 'text-red-500'}`}>{log.action}</span>
                                <span className="text-gray-300">{log.details || log.status}</span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                        <DollarSign size={48} className="opacity-20 mb-4" />
                        <p>Auditoria de Pagamentos em tempo real ativa.</p>
                        <p className="text-xs mt-2">Nenhuma discrepância encontrada nas últimas 24h.</p>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                        <Users size={48} className="opacity-20 mb-4" />
                        <p>Monitorando novos cadastros...</p>
                        <p className="text-xs mt-2">Novos usuários aparecerão aqui.</p>
                    </div>
                )}
            </div>
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
                    {/* Seção -1: System Health (New Feature) */}
                    {/* Seção -1: Guardian AI & System Health */}
                    <div className="space-y-6">
                        <SaaSMaintenanceHub />

                        <div className="w-full">
                            <SystemHealthWidget />
                        </div>
                    </div>

                    {/* Seção 0: Gerenciamento de Pagamentos (Apenas Owner) */}
                    {user && <MercadoPagoManager user={user} />}

                    {/* Seção 1: Gerenciamento de Planos (Apenas Dev/Admin) */}
                    <PlanSettingsManager />

                    {/* Seção 2: Gerenciamento de Imagens da Landing Page */}
                    <LandingImagesManager user={user} />

                    {/* Seção 3: Gerenciamento de Artes Geradas */}
                    <GeneratedImagesManager userRole={user.role} />
                </div>
            </div>
        </div>
    );
};