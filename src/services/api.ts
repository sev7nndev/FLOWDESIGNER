import { GeneratedImage, UsageData } from '../types'; 
import { getSupabase } from './supabaseClient'; // Importando getSupabase

// URL base para todas as chamadas de API.
export const API_BASE_URL = '/api'; // Usando proxy do Vite

// --- Funções de Geração ---

interface GeneratePayload {
    businessInfo: string;
    logoBase64: string | null;
}

const generateFlow = async (payload: GeneratePayload): Promise<GeneratedImage> => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
    }

    const response = await fetch(`${API_BASE_URL}/generation/flow`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`, // Enviando o token
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao gerar fluxo.' }));
        throw new Error(errorData.error || `Falha na geração: Status ${response.status}`);
    }
    
    return response.json();
};

// --- Funções de Uso (Mock) ---

const getUsage = async (_userId: string): Promise<UsageData> => { 
    // MOCK: Simula a busca de dados de uso
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Retorna dados mockados
    return {
        totalGenerations: 50,
        monthlyGenerations: 10,
        maxMonthlyGenerations: 100,
        credits: 8,
        generationsThisMonth: 2,
    };
};

// --- Exportação Principal ---

export const api = {
    generateFlow,
    getUsage,
    // Outras funções de API (a serem adicionadas)
};