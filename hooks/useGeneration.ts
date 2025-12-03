import { useState, useCallback, useEffect } from 'react';
import { GeneratedImage, GenerationState, GenerationStatus, BusinessInfo, User } from '../types';
import { api } from '../services/api';
import { PLACEHOLDER_EXAMPLES } from '../constants';
import { useUsage } from './useUsage'; 
import { toast } from 'sonner';
// import { getSupabase } from '../services/supabaseClient'; // Importando getSupabase

const INITIAL_FORM: BusinessInfo = {
    companyName: '', phone: '', addressStreet: '', addressNumber: '',
    addressNeighborhood: '', addressCity: '', details: '', logo: ''
};

const INITIAL_STATE: GenerationState = {
    status: GenerationStatus.IDLE,
    currentImage: null,
    history: [],
};

const MAX_LOGO_BASE64_LENGTH = 40000; 
const MAX_LOGO_KB = Math.round(MAX_LOGO_BASE64_LENGTH / 1.33 / 1024);

export const useGeneration = (user: User | null) => {
    const [form, setForm] = useState<BusinessInfo>(INITIAL_FORM);
    const [state, setState] = useState<GenerationState>(INITIAL_STATE);
    const { usage, isLoadingUsage, refreshUsage } = useUsage(user?.id);
    // const supabase = getSupabase(); // Usando getSupabase

    // Efeito para mostrar o aviso de "perto do limite"
    useEffect(() => {
        if (usage?.isNearLimit) {
            toast.warning('Você está perto de atingir seu limite de gerações.', {
                description: `Uso: ${usage.currentUsage}/${usage.maxQuota}. Considere fazer um upgrade para não interromper seu trabalho.`,
                duration: 10000,
            });
        }
    }, [usage?.isNearLimit, usage?.currentUsage, usage?.maxQuota]);

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
                    setForm((prev: BusinessInfo) => ({ ...prev, logo: '' }));
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
        
        if (usage?.isBlocked) {
            setState((prev: GenerationState) => ({ 
                ...prev, 
                status: GenerationStatus.ERROR, 
                error: `Você atingiu o limite de ${usage.maxQuota} gerações. Faça upgrade para continuar.` 
            }));
            return;
        }

        setState((prev: GenerationState) => ({ ...prev, status: GenerationStatus.GENERATING, error: undefined }));

        try {
            const newImage = await api.generate(form);
            
            await refreshUsage();
            await loadHistory();
            
            setState((prev: GenerationState) => ({
                status: GenerationStatus.SUCCESS,
                currentImage: newImage,
                history: [newImage, ...prev.history.filter((img: GeneratedImage) => img.id !== newImage.id)]
            }));
            toast.success("Sua arte foi gerada com sucesso!");

        } catch (err: any) {
            console.error(err);
            setState((prev: GenerationState) => ({ 
                ...prev, 
                status: GenerationStatus.ERROR, 
                error: err.message || "Erro ao gerar arte. Verifique se o Backend está rodando." 
            }));
        }
    }, [form, usage, refreshUsage, loadHistory]);

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
        setState,
        usage,
        isLoadingUsage
    };
};