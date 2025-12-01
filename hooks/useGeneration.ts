import { useState, useCallback } from 'react';
import { GenerationState, GenerationStatus, BusinessInfo, User, FormState } from '../types'; 
import { api } from '../services/api';
import { PLACEHOLDER_EXAMPLES } from '../constants';
import { useUsage } from './useUsage'; 

// Define o estado inicial do formulário, combinando BusinessInfo e FormState
const INITIAL_FORM_STATE: BusinessInfo & FormState = {
    companyName: '', phone: '', addressStreet: '', addressNumber: '',
    addressNeighborhood: '', addressCity: '', details: '', logo: '',
    prompt: '', 
    logoFile: null, 
};

const INITIAL_STATE: GenerationState = {
    status: GenerationStatus.IDLE,
    currentImage: null,
    history: [],
};

const MAX_LOGO_BASE64_LENGTH = 40000; 
const MAX_LOGO_KB = Math.round(MAX_LOGO_BASE64_LENGTH / 1.33 / 1024); 

export const useGeneration = (user: User | null) => {
    const [form, setForm] = useState<BusinessInfo & FormState>(INITIAL_FORM_STATE);
    const [state, setState] = useState<GenerationState>(INITIAL_STATE);
    const { usage, isLoadingUsage, refreshUsage } = useUsage(user?.id); 

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setForm((prev) => ({ ...prev, logo: '', logoFile: null }));
            return;
        }
        
        setForm((prev) => ({ ...prev, logoFile: file }));

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            if (base64String.length > MAX_LOGO_BASE64_LENGTH) {
                alert(`O logo é muito grande. O tamanho máximo permitido é de ${MAX_LOGO_KB}KB.`);
                setForm((prev) => ({ ...prev, logo: '', logoFile: null })); 
            } else {
                setForm((prev) => ({ ...prev, logo: base64String }));
            }
        };
        reader.readAsDataURL(file);
    }, []);

    const loadExample = useCallback(() => {
        const example = PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)];
        setForm({ ...example, prompt: "Crie um flyer de alta conversão para o negócio descrito abaixo, usando um estilo moderno e cores vibrantes.", logoFile: null });
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

    const downloadImage = useCallback((url: string, filename: string) => {
        // MOCK: In a real app, this would handle the download logic (e.g., using fetch and Blob)
        console.log(`Downloading image from ${url} as ${filename}`);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!form.companyName || !form.details || !form.prompt) return;
        
        if (usage?.isBlocked) {
            // FIX: Accessing max_usage safely (Error 1)
            const maxUsage = usage.max_usage; 
            setState((prev: GenerationState) => ({ 
                ...prev, 
                status: GenerationStatus.ERROR, 
                error: `Você atingiu o limite de ${maxUsage} gerações. Faça upgrade para continuar.` 
            }));
            return;
        }

        setState((prev: GenerationState) => ({ ...prev, status: GenerationStatus.GENERATING, error: undefined }));

        try {
            const businessInfoPayload = {
                companyName: form.companyName,
                phone: form.phone,
                addressStreet: form.addressStreet,
                addressNumber: form.addressNumber,
                addressNeighborhood: form.addressNeighborhood,
                addressCity: form.addressCity,
                details: form.details,
                logo: form.logo,
                prompt: form.prompt, 
            };

            const newImage = await api.generate(businessInfoPayload); 
            
            setState((prev: GenerationState) => ({ 
                ...prev, 
                status: GenerationStatus.SUCCESS, 
                currentImage: newImage,
                history: [newImage, ...prev.history],
            }));
            
            refreshUsage();

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido durante a geração.";
            setState((prev: GenerationState) => ({ ...prev, status: GenerationStatus.ERROR, error: errorMessage }));
        }
    }, [form, usage?.isBlocked, refreshUsage]);

    return {
        form,
        state,
        usage,
        isLoadingUsage,
        handleInputChange,
        handleLogoUpload,
        handleGenerate,
        loadHistory,
        loadExample,
        downloadImage,
    };
};