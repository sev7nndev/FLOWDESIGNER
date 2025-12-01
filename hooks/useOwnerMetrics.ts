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
}

const INITIAL_METRICS: OwnerMetrics = {
    planCounts: { free: 0, starter: 0, pro: 0 },
    statusCounts: { on: 0, paused: 0, cancelled: 0 },
    clients: [],
};

export const useOwnerMetrics = (user: User | null) => {
    const [metrics, setMetrics] = useState<OwnerMetrics>(INITIAL_METRICS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabase();

    const userId = user?.id;
    const userRole = user?.role;

    const fetchMetrics = useCallback(async () => {
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
                let errorText = `Erro do servidor: Status ${response.status}`;
                try {
                    // Tenta ler o corpo JSON do erro
                    const errorBody = await response.json();
                    errorText = errorBody.error || errorText;
                } catch (e) {
                    // Se falhar, o corpo estava vazio ou não era JSON
                    errorText += ". Resposta do servidor vazia ou inválida.";
                }
                throw new Error(errorText);
            }

            // Tenta ler o corpo JSON da resposta OK
            const data: OwnerMetrics = await response.json();
            setMetrics(data);

        } catch (e: any) {
            // Captura o erro de parsing JSON (Unexpected end of JSON input)
            if (e.message.includes('JSON')) {
                 setError("Falha ao carregar métricas. O servidor retornou uma resposta incompleta ou inválida. Verifique o log do backend.");
            } else {
                 setError(e.message || "Falha ao carregar métricas do painel.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [userId, userRole, supabase]);

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