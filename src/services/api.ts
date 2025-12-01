import { GeneratedImage, UsageData, UserRole } from '../types'; 
import { getSupabase } from './supabaseClient';

export const API_BASE_URL = '/api';

interface GeneratePayload {
    businessInfo: string;
    logoBase64: string | null;
}

const getAuthHeaders = async () => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
    };
};

const generateFlow = async (payload: GeneratePayload): Promise<GeneratedImage> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/generation/flow`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao gerar fluxo.' }));
        throw new Error(errorData.error || `Falha na geração: Status ${response.status}`);
    }
    
    return response.json();
};

const getUsage = async (_userId: string): Promise<UsageData> => { 
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        totalGenerations: 50,
        monthlyGenerations: 10,
        maxMonthlyGenerations: 100,
        credits: 8,
        generationsThisMonth: 2,
    };
};

const updateClientPlan = async (clientId: string, newPlan: UserRole, newStatus: 'on' | 'paused' | 'cancelled'): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/owner/update-plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ clientId, newPlan, newStatus }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao atualizar plano.' }));
        throw new Error(errorData.error || `Falha ao atualizar plano: Status ${response.status}`);
    }
};

export const api = {
    generateFlow,
    getUsage,
    updateClientPlan,
};