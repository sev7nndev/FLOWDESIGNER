import { User, GenerationFormState, GeneratedImage, UsageData } from '../types'; 

// URL base para todas as chamadas de API.
export const API_BASE_URL = '/api'; // Usando proxy do Vite

// --- Funções de Geração ---

interface GeneratePayload {
    businessInfo: string;
    logoBase64: string | null;
}

const generateFlow = async (payload: GeneratePayload): Promise<GeneratedImage> => {
    // MOCK: Simula uma chamada de API para o backend
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Simula a resposta de sucesso
    const mockImage: GeneratedImage = {
        id: Date.now().toString(),
        url: 'https://via.placeholder.com/800x450?text=Generated+Flow+Design',
        prompt: payload.businessInfo,
        negativePrompt: 'low quality, blurry',
        style: 'flowchart',
        aspectRatio: '16:9',
        createdAt: Date.now(),
        userId: 'mock-user-id',
    };

    return mockImage;
};

// --- Funções de Uso (Mock) ---

const getUsage = async (userId: string): Promise<UsageData> => {
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