import { useState, useCallback } from 'react';
import { GeneratedImage, GenerationState, GenerationStatus, BusinessInfo, User } from '../types';
import { api } from '../services/api';
import { PLACEHOLDER_EXAMPLES } from '../constants';
import { useUsage } from './useUsage'; // Importando o novo hook de uso

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
    const { usage, isLoadingUsage, refreshUsage } = useUsage(user?.id); // Usando o novo hook

    const handleInputChange = useCallback((field: keyof BusinessInfo, value: string) => {
        setForm((prev: BusinessInfo) => ({ ...prev, [field]: value }));
    }, []);

    const handleLogoUpload = useCallback((file: File) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                if (base64String.length > MAX_LOGO_BASE64_LENGTH) {
                    alert(`O logo é muito grande. O tamanho máximo permitido é de ${MAX_LOGO_KB}KB.`);
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
        
        // Verifica a quota localmente (embora o backend também verifique)
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
            
            // Após o sucesso, atualiza o uso e o histórico
            await refreshUsage();
            await loadHistory(); // Recarrega o histórico para obter o registro completo
            
            // Encontra a imagem recém-gerada no histórico (a mais recente)
            setState((prev: GenerationState) => ({
                status: GenerationStatus.SUCCESS,
                currentImage: newImage,
                history: [newImage, ...prev.history.filter(img => img.id !== newImage.id)] // Garante que a nova imagem esteja no topo
            }));

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
    
    // NOVO: Reseta o estado para IDLE
    const handleNewGeneration = useCallback(() => {
        setState(prev => ({ ...prev, status: GenerationStatus.IDLE, error: undefined }));
    }, []);
    
    // NOVO: Copia o prompt para a área de transferência
    const handleCopyPrompt = useCallback((prompt: string) => {
        navigator.clipboard.writeText(prompt).then(() => {
            alert("Prompt copiado para a área de transferência!");
        }).catch(err => {
            console.error("Falha ao copiar prompt:", err);
            alert("Falha ao copiar prompt.");
        });
    }, []);
    
    // NOVO: Simula o compartilhamento
    const handleShare = useCallback((image: GeneratedImage) => {
        if (navigator.share) {
            navigator.share({
                title: 'Minha Arte Flow Designer',
                text: `Confira a arte que gerei para ${image.businessInfo.companyName} usando Flow Designer!`,
                url: image.url,
            }).catch(err => {
                console.error("Falha ao compartilhar:", err);
                alert("Falha ao compartilhar. Tente baixar a imagem.");
            });
        } else {
            alert("Seu navegador não suporta a API de compartilhamento. Baixe a imagem para compartilhar.");
        }
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
        usage, // Expondo o uso
        isLoadingUsage,
        handleNewGeneration, // NOVO
        handleCopyPrompt,    // NOVO
        handleShare          // NOVO
    };
};