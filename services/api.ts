// services/api.ts

// ... (imports e outras funções)

// Função para buscar as imagens ativas da Landing Page
const getLandingImages = async (): Promise<LandingImage[]> => {
    const response = await fetch(`${API_BASE_URL}/public/landing-images`);
    if (!response.ok) {
        // Tenta ler o erro do corpo da resposta
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao buscar imagens.' }));
        throw new Error(errorData.error || `Falha ao buscar imagens: Status ${response.status}`);
    }
    return response.json();
};

// ... (outras funções)

export const api = {
    // ... (outras funções)
    getLandingImages,
    uploadLandingImage,
    deleteLandingImage,
    // ... (outras funções)
};