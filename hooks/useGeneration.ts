import { useState, useCallback } from 'react';
import { GeneratedImage, GenerationState, GenerationStatus, BusinessInfo, User, QuotaStatus, QuotaCheckResponse } from '../types';
import { api } from '../services/api';
import { PLACEHOLDER_EXAMPLES } from '../constants';
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

    const handleInputChange = useCallback((field: keyof BusinessInfo, value: string) => {
        setForm((prev: BusinessInfo) => ({ ...prev, [field]: value }));
    }, []);

    const handleLogoUpload = useCallback((file: File) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                if (base64String.length > MAX_LOGO_BASE64_LENGTH) {
                    toast.error(`O logo é muito grande. O tamanho máximo permitido é de ${MAX_LOGO_KB}KB.`);
                    setForm((prev: BusinessInfo) => ({ ...prev, logo: '' })); // Clear logo if too large
                } else {
                    setForm((prev: BusinessInfo) => ({ ...prev, logo: base64String }));
                }
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const loadExample = useCallback(() => {
        const example = PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)];
        setForm(example);
    }, []);

    const loadHistory = useCallback(async () => {
        if (!user) return;
        try {
            const history = await api.getHistory();
            setState((prev: GenerationState) => ({ ...prev, history }));
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }, [user]);

    const handleGenerate = useCallback(async () => {
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
            
            setState((prev: GenerationState) => ({ ...prev, status: GenerationStatus.GENERATING }));

            // 2. Proceed with generation
            const newImage = await api.generate(form);
            
            setState((prev: GenerationState) => ({
                status: GenerationStatus.SUCCESS,
                currentImage: newImage,
                history: [newImage, ...prev.history]
            }));
            
            toast.success("Arte gerada com sucesso!");
            
            // 3. Refresh usage data after successful generation
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
    }, [form, refreshUsage, openUpgradeModal]);

    const downloadImage = useCallback((image: GeneratedImage) => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `flow-${image.id.slice(0,4)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    return {
        form,
        state,
        handleInputChange,
        handleLogoUpload,
        handleGenerate,
        loadExample,
        loadHistory,
        downloadImage,
        setForm,
        setState
    };
};