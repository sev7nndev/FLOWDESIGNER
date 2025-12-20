import { useState, useCallback, useRef, useEffect } from 'react';
import { GeneratedImage, GenerationState, GenerationStatus, BusinessInfo, User, QuotaStatus, QuotaCheckResponse, ArtStyle } from '../types';
import { api } from '../services/api';
import { PLACEHOLDER_EXAMPLES } from '../constants';
import { ART_STYLES } from '../src/constants/artStyles';
import { toast } from 'sonner'; // Import toast

const INITIAL_FORM: BusinessInfo = {
    companyName: '', phone: '', addressStreet: '', addressNumber: '',
    addressNeighborhood: '', addressCity: '', details: '', logo: ''
};

const INITIAL_STATE: GenerationState = {
    status: GenerationStatus.IDLE,
    currentImage: null,
    history: [],
};

// Max Base64 length for logo (approx 30KB original file size)
const MAX_LOGO_BASE64_LENGTH = 40000;
const MAX_LOGO_KB = Math.round(MAX_LOGO_BASE64_LENGTH / 1.33 / 1024); // Approx 30KB

export const useGeneration = (user: User | null, refreshUsage: () => void, openUpgradeModal: (quota: QuotaCheckResponse) => void) => {
    const [form, setForm] = useState<BusinessInfo>(INITIAL_FORM);
    const [state, setState] = useState<GenerationState>(INITIAL_STATE);
    const [selectedStyle, setSelectedStyle] = useState<ArtStyle>(ART_STYLES[0]); // NEW: State for selected style

    const handleInputChange = useCallback((field: keyof BusinessInfo, value: string) => {
        setForm((prev: BusinessInfo) => ({ ...prev, [field]: value }));
    }, []);

    const handleLogoUpload = useCallback((file: File) => {
        if (!file) return;

        // Smart Compression Logic
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimensions to ensure small size (e.g., 300px width is enough for a logo on flyer)
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 0.7 quality to ensure it fits
                // Using JPEG/PNG dynamically? PNG is better for logos (transparency), but heavier.
                // Let's try PNG first, if too big, switch to JPEG? Or just resize aggressively.

                // For safety and size, we'll output PNG but resized heavily.
                // If the original file was < 50kb, keep it.

                const base64String = canvas.toDataURL('image/png');

                // Check size
                if (base64String.length > MAX_LOGO_BASE64_LENGTH) {
                    // Try JPEG if PNG is still too big
                    const jpegBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    if (jpegBase64.length <= MAX_LOGO_BASE64_LENGTH) {
                        setForm((prev: BusinessInfo) => ({ ...prev, logo: jpegBase64 }));
                        toast.success("Logo otimizada automaticamente!");
                        return;
                    }
                    toast.error(`A logo ainda é muito pesada mesmo comprimida. Tente uma imagem menor.`);
                } else {
                    setForm((prev: BusinessInfo) => ({ ...prev, logo: base64String }));
                    toast.success("Logo carregada!");
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    }, []);

    const loadExample = useCallback(() => {
        const example = PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)];
        setForm(example);
    }, []);

    const historyLoadedRef = useRef(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const loadHistory = useCallback(async () => {
        console.log('🔍 loadHistory called', { user: !!user, alreadyLoaded: historyLoadedRef.current });
        
        if (!user) {
            console.log('❌ loadHistory: No user, skipping');
            return;
        }
        
        if (historyLoadedRef.current) {
            console.log('✅ loadHistory: Already loaded, skipping');
            return;
        }
        
        if (isLoadingHistory) {
            console.log('⏸️ loadHistory: Already loading, skipping duplicate call');
            return;
        }
        
        console.log('⏳ loadHistory: Starting to load...');
        setIsLoadingHistory(true);
        
        try {
            console.log('📡 loadHistory: Calling api.getHistory()...');
            const history = await api.getHistory();
            console.log('✅ loadHistory: Got history:', history.length, 'images');
            
            setState((prev: GenerationState) => ({ ...prev, history }));
            historyLoadedRef.current = true;
            
            console.log('✅ loadHistory: State updated successfully');
        } catch (e) {
            console.error("❌ loadHistory: Failed to load history", e);
        } finally {
            console.log('🏁 loadHistory: Setting isLoadingHistory to false');
            setIsLoadingHistory(false);
        }
    }, [user, isLoadingHistory]);

    // Reset history loaded flag when user changes (login/logout)
    useEffect(() => {
        historyLoadedRef.current = false;
    }, [user?.id]);

    const handleGenerate = useCallback(async () => {
        // Guard against race conditions - prevent duplicate requests
        if (state.status === GenerationStatus.THINKING || state.status === GenerationStatus.GENERATING) {
            console.warn('Generation already in progress, ignoring duplicate request');
            return;
        }

        if (!form.companyName || !form.details) return;

        setState((prev: GenerationState) => ({ ...prev, status: GenerationStatus.THINKING, error: undefined }));

        try {
            // 1. Check Quota before starting generation
            const quotaResponse = await api.checkQuota();

            if (quotaResponse.status === QuotaStatus.BLOCKED) {
                setState((prev: GenerationState) => ({
                    ...prev,
                    status: GenerationStatus.IDLE,
                    error: quotaResponse.message || "Limite de geração atingido."
                }));
                openUpgradeModal(quotaResponse);
                return;
            }

            if (quotaResponse.status === QuotaStatus.NEAR_LIMIT) {
                toast.warning(quotaResponse.message || "Você está perto do limite de gerações do seu plano.", {
                    duration: 5000,
                    action: {
                        label: 'Upgrade',
                        onClick: () => openUpgradeModal(quotaResponse),
                    },
                });
            }

            setState((prev: GenerationState) => ({
                ...prev,
                status: GenerationStatus.GENERATING,
                currentImage: null // Clear old image to show skeleton
            }));

            // 2. Generate Clean Background (Backend)
            const cleanImage = await api.generate(form, selectedStyle);

            // 3. (REMOVED) Frontend Text Overlay
            // The backend (Imagen 4 Ultra) now handles all text generation.
            // We use the clean image directly.
            const finalImageUrl = cleanImage.url;
            
            const hybridImage = { ...cleanImage, url: finalImageUrl };

            setState((prev: GenerationState) => ({
                status: GenerationStatus.SUCCESS,
                currentImage: hybridImage,
                history: [hybridImage, ...prev.history]
            }));

            toast.success("Arte gerada com sucesso!");

            // 4. Refresh usage data after successful generation
            refreshUsage();

        } catch (err: any) {
            console.error(err);

            // Check for BLOCKED status returned from the /api/generate endpoint
            if (err.quotaStatus === QuotaStatus.BLOCKED) {
                setState((prev: GenerationState) => ({
                    ...prev,
                    status: GenerationStatus.IDLE,
                    error: err.message || "Limite de geração atingido."
                }));
                openUpgradeModal(err);
                return;
            }

            setState((prev: GenerationState) => ({
                ...prev,
                status: GenerationStatus.ERROR,
                error: err.message || "Erro ao gerar arte. Verifique se o Backend está rodando."
            }));
            toast.error(err.message || "Erro ao gerar arte.");
        }
    }, [form, selectedStyle, refreshUsage, openUpgradeModal, state.status]);

    const downloadImage = useCallback((image: GeneratedImage) => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `flow-${image.id.slice(0, 4)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleEnhancePrompt = useCallback(async () => {
        if (!form.details || form.details.length < 5) {
            toast.error("Digite pelo menos algumas palavras para a IA melhorar.");
            return;
        }

        setIsEnhancing(true);
        try {
            const enhanced = await api.enhancePrompt(form.details, form);
            setForm(prev => ({ ...prev, details: enhanced }));
            toast.success("Prompt melhorado com sucesso!");
        } catch (error) {
            console.error("Enhance prompt error:", error);
            toast.error("Erro ao melhorar prompt. Tente novamente.");
        } finally {
            setIsEnhancing(false);
        }
    }, [form.details, form]);

    // NEW: Delete from history
    const deleteHistoryItem = useCallback(async (image: GeneratedImage) => {
        try {
            await api.deleteImage(image.id);
            setState((prev: GenerationState) => ({
                ...prev,
                history: prev.history.filter(i => i.id !== image.id),
                // If the deleted image was the current one, perhaps clear it? 
                // Let's keep it visible for now unless user clears it presumably. 
                // But usually history deletion doesn't affect current view if it's separate.
            }));
            toast.success("Imagem removida da galeria.");
        } catch (e: any) {
            toast.error(e.message || "Erro ao excluir imagem.");
        }
    }, []);

    return {
        form,
        state,
        selectedStyle,
        setSelectedStyle,
        handleInputChange,
        handleLogoUpload,
        handleGenerate,
        loadExample,
        loadHistory,
        downloadImage,
        setForm,
        setState,
        handleEnhancePrompt,
        isEnhancing,
        deleteHistoryItem,
        isLoadingHistory // Exported
    };
};