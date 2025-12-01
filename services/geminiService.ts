/**
 * Serviço para interagir com a API de geração de imagens do Gemini no backend.
 */
const geminiService = {
    /**
     * Envia um prompt para o backend e recebe uma imagem gerada em base64.
     * @param prompt O texto descritivo para a imagem.
     * @returns Uma string base64 da imagem gerada.
     */
    generateImage: async (prompt: string): Promise<string> => {
        try {
            const response = await fetch('/api/gemini/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha na comunicação com o servidor.');
            }

            const data = await response.json();
            
            // O backend retorna a imagem em base64
            return data.image;

        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao gerar imagem.');
        }
    },
};

export default geminiService;