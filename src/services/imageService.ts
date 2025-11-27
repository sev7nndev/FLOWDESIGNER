import { supabase } from '../integrations/supabase/client';
import { Image } from '../types';

export const imageService = {
    getImages: async (): Promise<Image[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado.');

        const { data, error } = await supabase
            .from('images')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar histórico de imagens:', error);
            throw new Error('Não foi possível carregar seu histórico de imagens.');
        }

        return data || [];
    },
};