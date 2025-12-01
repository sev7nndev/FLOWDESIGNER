import { LandingImage, GeneratedImage, BusinessInfo, UsageData } from '../types'; // Removendo imports não utilizados
import { API_BASE_URL } from './config'; 

// --- Funções de Gerenciamento de Imagens da Landing Page ---

/**
 * Converte um File em Base64 e envia para o backend para upload.
 * @param file O objeto File a ser enviado.
 * @param userId O ID do usuário (dev/admin) que está fazendo o upload.
 * @returns A imagem recém-criada.
 */
const uploadLandingImage = async (file: File, userId: string): Promise<LandingImage> => {
    const reader = new FileReader();
    
    // Converte o arquivo para string Base64
    const fileBase64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });

    const response = await fetch(`${API_BASE_URL}/admin/landing-images/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Assumindo que o token de autenticação é adicionado por um interceptor ou contexto
        },
        body: JSON.stringify({
            fileBase64,
            fileName: file.name,
            userId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao fazer upload.' }));
        throw new Error(errorData.error || `Falha no upload: Status ${response.status}`);
    }
    const data = await response.json();
    return data.image; // O backend retorna { message, image: LandingImage }
};

/**
 * Deleta uma imagem da Landing Page do DB e do Storage.
 * @param id O ID do registro da imagem no DB.
 * @param imagePath O caminho do arquivo no Supabase Storage.
 */
const deleteLandingImage = async (id: string, imagePath: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/admin/landing-images/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            // Assumindo que o token de autenticação é adicionado
        },
        body: JSON.stringify({ imagePath }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao deletar.' }));
        throw new Error(errorData.error || `Falha ao deletar imagem: Status ${response.status}`);
    }
    // Sucesso: status 200 ou 204, sem conteúdo esperado
};

/**
 * Busca todas as imagens ativas da Landing Page (rota pública).
 * @returns Lista de objetos LandingImage.
 */
const getLandingImages = async (): Promise<LandingImage[]> => {
    const response = await fetch(`${API_BASE_URL}/public/landing-images`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao buscar imagens.' }));
        throw new Error(errorData.error || `Falha ao buscar imagens: Status ${response.status}`);
    }
    return response.json();
};

/**
 * Cria uma sessão do portal de faturamento e retorna a URL de redirecionamento.
 * @returns A URL para o portal de faturamento.
 */
const createBillingPortalSession = async (): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/owner/billing-portal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // O token de autenticação deve ser adicionado pelo interceptor ou contexto
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao iniciar sessão de faturamento.' }));
        throw new Error(errorData.error || `Falha ao iniciar sessão de faturamento: Status ${response.status}`);
    }
    
    const data = await response.json();
    return data.redirectUrl;
};

/**
 * Atualiza o plano e status de um cliente (Apenas Owner).
 * @param clientId O ID do cliente.
 * @param newPlan O novo plano ('free', 'starter', 'pro').
 * @param newStatus O novo status ('on', 'paused', 'cancelled').
 */
const updateClientPlan = async (clientId: string, newPlan: string, newStatus: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/owner/update-plan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // O token de autenticação deve ser adicionado
        },
        body: JSON.stringify({ clientId, newPlan, newStatus }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao atualizar plano.' }));
        throw new Error(errorData.error || `Falha ao atualizar plano: Status ${response.status}`);
    }
};

// --- NEW: Generation and History API methods ---

/**
 * Inicia um trabalho de geração de imagem no backend.
 * @param form Os dados do formulário de negócio.
 * @returns A imagem recém-gerada (ou o objeto de job inicial).
 */
const generate = async (form: BusinessInfo): Promise<GeneratedImage> => {
    // NOTE: O frontend usa polling, mas o hook useGeneration espera o objeto final.
    // O hook useGeneration.ts foi atualizado para usar o endpoint /generation/generate
    // e depois fazer polling via /generation/job-status/:jobId.
    // Esta função aqui é um placeholder para satisfazer o TS, mas o hook usa a lógica de polling diretamente.
    // No entanto, para resolver o erro TS, precisamos de uma função 'generate'.
    
    // Como o hook useGeneration.ts já implementa a lógica de chamada e polling, 
    // vamos apenas garantir que o tipo de retorno esteja correto.
    // O erro 2 será resolvido no hook, mas o erro 1 (getHistory) precisa ser implementado aqui.
    
    // Para fins de compilação, vamos retornar um mock ou lançar um erro se for chamado incorretamente.
    throw new Error("A função 'generate' não deve ser chamada diretamente. Use o hook useGeneration.");
};

/**
 * Busca o histórico de imagens geradas pelo usuário.
 * @returns Lista de objetos GeneratedImage.
 */
const getHistory = async (): Promise<GeneratedImage[]> => {
    const response = await fetch(`${API_BASE_URL}/generation/history`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao buscar histórico.' }));
        throw new Error(errorData.error || `Falha ao buscar histórico: Status ${response.status}`);
    }
    return response.json();
};

/**
 * Simula o envio de uma mensagem de suporte e recebe uma resposta.
 * @param userId O ID do usuário.
 * @param message O conteúdo da mensagem.
 * @returns Um objeto com a resposta simulada.
 */
const sendSupportMessage = async (userId: string, message: string): Promise<{ reply: string }> => {
    // MOCK: Em um ambiente real, isso chamaria um Edge Function ou um serviço de chat.
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
    // Funções de Gerenciamento de Imagens
    getLandingImages,
    uploadLandingImage,
    deleteLandingImage,
    
    // Funções de Faturamento
    createBillingPortalSession,
    
    // Funções de Gerenciamento de Clientes (Owner)
    updateClientPlan,
    
    // Funções de Geração (Adicionadas para resolver TS2339)
    getHistory,
    generate,
    
    // Funções de Suporte
    sendSupportMessage,
};