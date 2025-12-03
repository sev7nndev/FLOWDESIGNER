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
  planCounts: {
    free: 0,
    starter: 0,
    pro: 0
  },
  statusCounts: {
    on: 0,
    paused: 0,
    cancelled: 0
  },
  clients: [],
  mpConnectionStatus: 'loading'
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
        let errorBody = { error: `Erro do servidor: Status ${response.status}` };
        
        // Tenta analisar o corpo da resposta como JSON, mas de forma defensiva
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            errorBody = await response.json();
          } else {
            // Se não for JSON, tenta ler como texto (pode ser vazio)
            const text = await response.text();
            if (text) {
              errorBody.error = `Erro do servidor: Status ${response.status}. Resposta: ${text.substring(0, 100)}...`;
            }
          }
        } catch (e) {
          // Falha na análise de JSON (Unexpected end of JSON input)
          console.warn("Falha ao analisar JSON de erro do backend:", e);
        }
        
        throw new Error(errorBody.error || `Erro desconhecido: Status ${response.status}`);
      }

      const data: OwnerMetrics = await response.json();
      setMetrics(data);
    } catch (e: any) {
      console.error("Failed to fetch owner metrics:", e);
      setError(e.message || "Falha ao carregar métricas do painel.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, supabase]);

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