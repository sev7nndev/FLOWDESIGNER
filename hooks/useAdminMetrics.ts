import { useState, useEffect, useCallback } from 'react';
import { AdminMetrics, UserRole } from '../types';
import { api } from '../services/api';

const INITIAL_METRICS: AdminMetrics = {
    totalRevenue: '0.00',
    activeSubscriptions: 0,
    inactiveSubscriptions: 0,
    totalUsers: 0,
};

export const useAdminMetrics = (userRole: UserRole) => {
    const [metrics, setMetrics] = useState<AdminMetrics>(INITIAL_METRICS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = useCallback(async () => {
        if (userRole !== 'admin' && userRole !== 'dev' && userRole !== 'owner') {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const data = await api.getAdminMetrics();
            setMetrics(data);
        } catch (e: any) {
            console.error("Failed to fetch admin metrics:", e);
            setError(e.message || "Falha ao carregar métricas do painel.");
        } finally {
            setIsLoading(false);
        }
    }, [userRole]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return {
        metrics,
        isLoadingMetrics: isLoading,
        errorMetrics: error,
        fetchMetrics,
    };
};