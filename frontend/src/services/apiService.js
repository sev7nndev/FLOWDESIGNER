// frontend/src/services/apiService.js
import { supabase } from '../supabaseClient';

const API_BASE_URL = '/api';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Usuário não autenticado.");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
    };
};

export const apiService = {
    // --- Planos ---
    getPlans: async () => {
        const response = await fetch(`${API_BASE_URL}/plans`);
        if (!response.ok) {
            throw new Error('Falha ao carregar planos.');
        }
        return response.json();
    },

    // --- Pagamento ---
    createPaymentPreference: async (planId) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/payments/create-preference`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ planId }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao criar preferência de pagamento.');
        }
        const data = await response.json();
        return data.init_point;
    },

    // --- Geração de Imagem (Placeholder) ---
    generateImage: async (prompt) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/images/generate`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao gerar imagem.');
        }
        return response.json();
    },
    
    // --- Configuração Pública (Carrossel) ---
    getCarouselImages: async () => {
        const response = await fetch(`${API_BASE_URL}/config/carousel_images`);
        if (!response.ok) {
            // Retorna um array vazio ou padrão em caso de falha
            console.error("Falha ao carregar imagens do carrossel.");
            return [];
        }
        return response.json();
    },
};