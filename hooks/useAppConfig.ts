import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface AppConfig {
    saasLogoUrl: string | null;
    isLoading: boolean;
    error: string | null;
}

const INITIAL_STATE: AppConfig = {
    saasLogoUrl: null,
    isLoading: true,
    error: null,
};

export const useAppConfig = () => {
    const [config, setConfig] = useState<AppConfig>(INITIAL_STATE);

    const fetchConfig = useCallback(async () => {
        setConfig(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const logoUrl = await api.getSaasLogoUrl();
            setConfig({
                saasLogoUrl: logoUrl,
                isLoading: false,
                error: null,
            });
        } catch (e: any) {
            console.error("Failed to fetch app config:", e);
            setConfig({
                saasLogoUrl: null,
                isLoading: false,
                error: e.message || 'Falha ao carregar configurações globais.',
            });
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);
    
    const refreshConfig = useCallback(() => {
        fetchConfig();
    }, [fetchConfig]);

    return {
        ...config,
        refreshConfig
    };
};