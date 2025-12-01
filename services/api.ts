import { LandingImage } from '../types'; // Removendo imports não utilizados
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


// --- Exportação Principal ---

export const api = {
    // ... (Outras funções de API)
    
    // Funções de Gerenciamento de Imagens
    getLandingImages,
    uploadLandingImage,
    deleteLandingImage,
    
    // Funções de Faturamento
    createBillingPortalSession,
};