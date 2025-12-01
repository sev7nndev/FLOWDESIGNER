import { useState, useCallback } from 'react';
import { User, GenerationFormState, GeneratedImage, GenerationStatus, GenerationState } from '../types';
import { useUsage } from './useUsage';
import { api } from '../services/api';

// Define o estado inicial do formulário
const INITIAL_FORM_STATE: GenerationFormState = {
    businessInfo: '', 
    logoFile: null,
};

const INITIAL_STATE: GenerationState = {
    status: GenerationStatus.IDLE,
    currentImage: null,
    history: [],
    error: null,
};

// Define o retorno esperado
interface GenerationResult {
    form: GenerationFormState;
    state: GenerationState;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGenerate: (e: React.FormEvent) => Promise<void>;
    loadExample: () => void;
    loadHistory: () => void;
    usage: ReturnType<typeof useUsage>['usage'];
    isLoadingUsage: ReturnType<typeof useUsage>['isLoadingUsage'];
    downloadImage: (url: string, filename: string) => void;
}

const MAX_LOGO_SIZE_MB = 5;

export const useGeneration = (user: User | null, _config?: any): GenerationResult => {
    const [form, setForm] = useState<GenerationFormState>(INITIAL_FORM_STATE);
    const [state, setState] = useState<GenerationState>(INITIAL_STATE);
    
    // Integração do hook de uso
    const { usage, isLoadingUsage, refreshUsage } = useUsage(user);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'businessInfo') {
            setForm(prev => ({ ...prev, businessInfo: value }));
        }
    }, []);

    const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        
        if (file && file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
            setState(prev => ({ ...prev, error: `O arquivo do logo é muito grande (Máx: ${MAX_LOGO_SIZE_MB}MB).` }));
            setForm(prev => ({ ...prev, logoFile: null }));
            return;
        }
        
        setForm(prev => ({ ...prev, logoFile: file }));
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const loadExample = useCallback(() => {
        setForm(prev => ({
            ...prev,
            businessInfo: 'Uma startup de SaaS que vende software de gestão de projetos para equipes remotas. O fluxo deve mostrar a integração entre o cadastro do usuário, o envio de email de boas-vindas e a criação de um projeto inicial.', 
        }));
    }, []);

    const loadHistory = useCallback(() => {
        // Simulação de carregamento de histórico
        // Em um app real, isso chamaria a API para buscar o histórico do usuário
        setState(prev => ({ ...prev, history: [] }));
    }, []);

    const downloadImage = useCallback((url: string, filename: string) => {
        // Lógica de download (simplesmente abre a URL para download)
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleGenerate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            setState(prev => ({ ...prev, error: 'Usuário não autenticado.' }));
            return;
        }
        
        if (usage.credits <= 0) {
            setState(prev => ({ ...prev, error: 'Você está sem créditos. Faça um upgrade.' }));
            return;
        }
        
        if (!form.businessInfo.trim()) {
            setState(prev => ({ ...prev, error: 'A descrição do negócio é obrigatória.' }));
            return;
        }

        setState(prev => ({ ...prev, status: GenerationStatus.LOADING, error: null }));

        try {
            let logoBase64: string | null = null;
            if (form.logoFile) {
                // Converte o arquivo para Base64 para envio (simplificado)
                logoBase64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(form.logoFile!);
                });
            }

            const payload = {
                businessInfo: form.businessInfo,
                logoBase64: logoBase64,
            };

            const newImage = await api.generateFlow(payload);
            
            setState(prev => ({ 
                ...prev,
                currentImage: newImage,
                history: [newImage, ...prev.history].slice(0, 5),
                status: GenerationStatus.SUCCESS, 
            }));
            
            // Atualiza o uso após a geração
            refreshUsage();

        } catch (e: any) {
            setState(prev => ({ 
                ...prev, 
                status: GenerationStatus.ERROR, 
                error: e.message || 'Falha desconhecida na geração do fluxo.' 
            }));
        }
    }, [form, user, usage.credits, refreshUsage]);

    return {
        form,
        state,
        handleInputChange,
        handleLogoUpload,
        handleGenerate,
        loadExample,
        loadHistory,
        usage,
        isLoadingUsage,
        downloadImage,
    };
};