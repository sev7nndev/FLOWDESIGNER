import { LandingImage, GeneratedImage, BusinessInfo } from '../types'; 
import { API_BASE_URL } from './config'; 

// --- Funções de Gerenciamento de Imagens da Landing Page ---

const uploadLandingImage = async (file: File, userId: string): Promise<LandingImage> => {
    const reader = new FileReader();
    
    const fileBase64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });

    const response = await fetch(`${API_BASE_URL}/admin/landing-images/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64, fileName: file.name, userId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao fazer upload.' }));
        throw new Error(errorData.error || `Falha no upload: Status ${response.status}`);
    }
    const data = await response.json();
    return data.image; 
};

const deleteLandingImage = async (id: string, imagePath: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/admin/landing-images/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao deletar.' }));
        throw new Error(errorData.error || `Falha ao deletar imagem: Status ${response.status}`);
    }
};

const getLandingImages = async (): Promise<LandingImage[]> => {
    const response = await fetch(`${API_BASE_URL}/public/landing-images`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao buscar imagens.' }));
        throw new Error(errorData.error || `Falha ao buscar imagens: Status ${response.status}`);
    }
    return response.json();
};

// --- Funções de Faturamento e Clientes ---

const createBillingPortalSession = async (): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/owner/billing-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao iniciar sessão de faturamento.' }));
        throw new Error(errorData.error || `Falha ao iniciar sessão de faturamento: Status ${response.status}`);
    }
    
    const data = await response.json();
    return data.redirectUrl;
};

const updateClientPlan = async (clientId: string, newPlan: string, newStatus: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/owner/update-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, newPlan, newStatus }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao atualizar plano.' }));
        throw new Error(errorData.error || `Falha ao atualizar plano: Status ${response.status}`);
    }
};

// --- Generation and History API methods ---

const generate = async (form: BusinessInfo & { prompt: string }): Promise<GeneratedImage> => {
    const response = await fetch(`${API_BASE_URL}/generation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao gerar imagem.' }));
        throw new Error(errorData.error || `Falha na geração: Status ${response.status}`);
    }
    return response.json();
};

const getHistory = async (): Promise<GeneratedImage[]> => {
    const response = await fetch(`${API_BASE_URL}/generation/history`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao buscar histórico.' }));
        throw new Error(errorData.error || `Falha ao buscar histórico: Status ${response.status}`);
    }
    return response.json();
};

// --- Funções de Suporte (Fixes 5, 6) ---

const sendSupportMessage = async (userId: string, message: string): Promise<{ reply: string }> => { 
    // MOCK: Em um ambiente real, isso chamaria um Edge Function ou um serviço de chat.
    // FIX: Use userId and message to avoid TS6133
    console.log(`Sending message from user ${userId}: ${message}`); 
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockReplies = [
        "Entendi sua questão. Vou encaminhar para a equipe de especialistas.",
        "Obrigado por entrar em contato! Qual é o seu ID de usuário para que eu possa verificar?",
        "Isso parece ser um problema técnico. Você já tentou limpar o cache?",
        "Sua solicitação foi registrada. Responderemos em breve!",
    ];
    
    return { reply: mockReplies[Math.floor(Math.random() * mockReplies.length)] };
};


// --- Exportação Principal ---

export const api = {
    getLandingImages,
    uploadLandingImage,
    deleteLandingImage,
    createBillingPortalSession,
    updateClientPlan,
    getHistory, 
    generate,   
    sendSupportMessage, 
};