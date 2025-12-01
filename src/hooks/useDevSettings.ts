import { useState, useEffect, useCallback } from 'react';

export interface DevSettings {
    isAiOnline: boolean;
    mockLatencyMs: number;
    mockErrorRate: number; // 0.0 to 1.0
    mockErrorType: 'none' | 'server' | 'credits';
}

const DEFAULT_SETTINGS: DevSettings = {
    isAiOnline: true,
    mockLatencyMs: 500,
    mockErrorRate: 0.0,
    mockErrorType: 'none',
};

const STORAGE_KEY = 'dev_settings';

export const useDevSettings = () => {
    const [settings, setSettings] = useState<DevSettings>(() => {
        try {
            const storedSettings = localStorage.getItem(STORAGE_KEY);
            if (storedSettings) {
                return JSON.parse(storedSettings);
            }
        } catch (e) {
            console.error("Failed to load dev settings from storage", e);
        }
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save dev settings to storage", e);
        }
    }, [settings]);

    const updateSetting = useCallback(<K extends keyof DevSettings>(key: K, value: DevSettings[K]) => {
        setSettings(prev => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    return {
        settings,
        updateSetting,
        resetSettings,
    };
};