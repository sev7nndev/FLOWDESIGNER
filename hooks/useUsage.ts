import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '../services/supabaseClient';

export interface UsageData {
    currentUsage: number;
    maxQuota: number;
    planId: string;
    isBlocked: boolean;
}

export const useUsage = (userId: string | undefined) => {
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = getSupabase();

    const fetchUsage = useCallback(async () => {
        if (!userId || !supabase) {
            setUsage(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            // 1. Busca o uso atual e o ID do plano
            const { data: usageData, error: usageError } = await supabase
                .from('user_usage')
                .select('current_usage, plan_id')
                .eq('user_id', userId)
                .single();

            if (usageError || !usageData) {
                // Se não encontrar, pode ser um usuário recém-criado antes do trigger rodar
                setUsage({ currentUsage: 0, maxQuota: 3, planId: 'free', isBlocked: false });
                setIsLoading(false);
                return;
            }
            
            // 2. Busca o limite máximo do plano
            const { data: planData } = await supabase
                .from('plan_settings')
                .select('max_images_per_month')
                .eq('id', usageData.plan_id)
                .single();
                
            const maxQuota = planData?.max_images_per_month || 0;
            const currentUsage = usageData.current_usage || 0;
            const planId = usageData.plan_id;
            
            const isBlocked = currentUsage >= maxQuota && planId !== 'admin' && planId !== 'dev';

            setUsage({
                currentUsage,
                maxQuota,
                planId,
                isBlocked
            });

        } catch (e) {
            console.error("Failed to fetch usage:", e);
            setUsage(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId, supabase]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    return { usage, isLoadingUsage: isLoading, refreshUsage: fetchUsage };
};