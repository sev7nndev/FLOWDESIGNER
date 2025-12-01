import { useState, useEffect, useCallback } from 'react';
import { UsageData, User } from '../types';
import { api } from '../services/api';

const INITIAL_USAGE: UsageData = {
    totalGenerations: 0,
    monthlyGenerations: 0,
    maxMonthlyGenerations: 0,
    credits: 0,
    generationsThisMonth: 0,
};

export const useUsage = (user: User | null) => {
    const [usage, setUsage] = useState<UsageData>(INITIAL_USAGE);
    const [isLoadingUsage, setIsLoadingUsage] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsage = useCallback(async () => {
        if (!user) {
            setUsage(INITIAL_USAGE);
            setIsLoadingUsage(false);
            return;
        }

        setIsLoadingUsage(true);
        setError(null);
        try {
            // NOTE: Using mock API for now, replace with Supabase call later
            const data = await api.getUsage(user.id); 
            setUsage(data);
        } catch (e: any) {
            setError(e.message || 'Falha ao carregar dados de uso.');
            setUsage(INITIAL_USAGE);
        } finally {
            setIsLoadingUsage(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    return { usage, isLoadingUsage, error, refreshUsage: fetchUsage };
};