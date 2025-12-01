import { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { getSupabase } from '../services/supabaseClient';

const API_BASE_URL = "/api"; 

interface ClientData {
    id: string;
    name: string;
    email: string;
    plan: UserRole;
    status: 'on' | 'paused' | 'cancelled';
}

interface OwnerMetrics {
    planCounts: {
        free: number;
        starter: number;
        pro: number;
        business: number; // Added business
    };
    statusCounts: {
        on: number;
        paused: number;
        cancelled: number;
    };
    clients: ClientData[];
    estimatedRevenue: number; 
}

const INITIAL_METRICS: OwnerMetrics = {
    planCounts: { free: 0, starter: 0, pro: 0, business: 0 },
    statusCounts: { on: 0, paused: 0, cancelled: 0 },
    clients: [],
    estimatedRevenue: 0, 
};

export const useOwnerMetrics = (user: User | null) => {
    const [metrics, setMetrics] = useState<OwnerMetrics>(INITIAL_METRICS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabase();

    const fetchMetrics = useCallback(async () => {
        if (!user || user.role !== 'owner') {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Sessão não encontrada.");

            const response = await fetch(`${API_BASE_URL}/owner/metrics`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}` 
                }
            });

            if (!response.ok) {
                let errorBody = { error: `Erro do servidor: Status ${response.status}` };
                try {
                    errorBody = await response.json();
                } catch (e) {
                    console.warn("Falha ao analisar JSON de erro do backend.");
                }
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
    }, [user, supabase]);

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