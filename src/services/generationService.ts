import { supabase } from '../integrations/supabase/client';
import { BusinessInfo } from '../types';

// Função auxiliar para obter o token de autenticação do usuário
const getAuthToken = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('Usuário não autenticado.');
    }
    return session.access_token;
};

export const generationService = {
    generateArt: async (businessInfo: BusinessInfo): Promise<{ imageUrl: string }> => {
        const token = await getAuthToken();
        
        const functionUrl = 'https://akynbiixxcftxgvjpjxu.supabase.co/functions/v1/generate-art';

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(businessInfo),
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 504) {
                 throw new Error('O servidor demorou muito para responder (timeout). Tente novamente em alguns instantes.');
            }
            if (response.status === 401) {
                throw new Error('Não autorizado. Por favor, faça login novamente.');
            }
            // Tenta extrair uma mensagem de erro do JSON, se houver
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error) {
                    throw new Error(errorJson.error);
                }
            } catch (e) {
                // Ignora se não for JSON e lança o texto original
            }
            throw new Error(errorText || `Erro na comunicação com o servidor: ${response.statusText}`);
        }

        const responseText = await response.text();
        if (!responseText) {
            throw new Error('O servidor retornou uma resposta vazia. A geração pode ter falhado.');
        }

        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.error('Falha ao analisar JSON. Resposta do servidor:', responseText);
            throw new Error('O servidor retornou uma resposta inesperada. Por favor, contate o suporte.');
        }
    },
};