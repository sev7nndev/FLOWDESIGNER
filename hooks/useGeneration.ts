import React, { useState, useCallback } from 'react';
import { GeneratedImage, GenerationState, GenerationStatus, BusinessInfo, User } from '../types';
import { api } from '../services/api';
import { PLACEHOLDER_EXAMPLES } from '../constants';

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

export const useGeneration = (user: User | null) => {
    const [form, setForm] = useState<BusinessInfo>(INITIAL_FORM);
    const [state, setState] = useState<GenerationState>(INITIAL_STATE);

    const handleInputChange = useCallback((field: keyof BusinessInfo, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleLogoUpload = useCallback((file: File) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                if (base64String.length > MAX_LOGO_BASE64_LENGTH) {
                    alert(`O logo é muito grande. O tamanho máximo permitido é de ${MAX_LOGO_KB}KB.`);
                    setForm(prev => ({ ...prev, logo: '' })); // Clear logo if too large
                } else {
                    setForm(prev => ({ ...prev, logo: base64String }));
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
            setState(prev => ({ ...prev, history }));
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }, [user]);

    const handleGenerate = useCallback(async () => {
        if (!form.companyName || !form.details) return;

        setState(prev => ({ ...prev, status: GenerationStatus.GENERATING, error: undefined }));

        try {
            const newImage = await api.generate(form);
            
            setState(prev => ({
                status: GenerationStatus.SUCCESS,
                currentImage: newImage,
                history: [newImage, ...prev.history]
            }));

        } catch (err: any) {
            console.error(err);
            setState(prev => ({ 
                ...prev, 
                status: GenerationStatus.ERROR, 
                error: err.message || "Erro ao gerar arte. Verifique se o Backend está rodando." 
            }));
        }
    }, [form]);

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