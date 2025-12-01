import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../services/supabaseClient';
import { User } from '../types';

const BACKEND_URL = "/api"; 

interface ClientData {
    id: string;
    name: string;
    email: string;
    plan: string;
    status: string;
}

interface OwnerMetrics {
    planCounts: {
        free: number;
        starter: number;
        pro: number;
    };
    statusCounts: {
        on: number;
        paused: number;
        cancelled: number;
    };
    clients: ClientData[];
    mpConnectionStatus: 'connected' | 'disconnected' | 'loading';
}

const INITIAL_METRICS: OwnerMetrics = {
    planCounts: { free: 0, starter: 0, pro: 0 },
    statusCounts: { on: 0, paused: 0, cancelled: 0 },
    clients: [],
    mpConnectionStatus: 'loading',
};

export const useOwnerMetrics = (user: User | null) => {
    const [metrics, setMetrics] = useState<OwnerMetrics>(INITIAL_METRICS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabase();

    const fetchMetrics = useCallback(async () => {
        const userId = user?.id;
        const userRole = user?.role;
        
        if (!userId || userRole !== 'owner') {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase!.auth.getSession();
            if (!session) throw new Error("Sessão não encontrada.");

            const response = await fetch(`${BACKEND_URL}/owner/metrics`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}` 
                }
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error || `Erro do servidor: Status ${response.status}`);
            }

            const data: OwnerMetrics = await response.json();
            setMetrics(data);

        } catch (e: any) {
            console.error("Failed to fetch owner metrics:", e);
            setError(e.message || "Falha ao carregar métricas do painel.");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, user?.role, supabase]); // Depende apenas do ID e da Role, não do objeto 'user' completo

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return {
        metrics,
        isLoadingMetrics: isLoading,
        errorMetrics: error,
        refreshMetrics: fetchMetrics
    };
};