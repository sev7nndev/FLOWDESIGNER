import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '@/services/supabaseClient';

export interface UsageData {
  currentUsage: number;
  maxQuota: number;
  planId: string;
  isBlocked: boolean;
  isNearLimit: boolean;
  usagePercentage: number;
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
      // RLS garante que o usuário só possa ler seus próprios dados.
      const { data, error } = await supabase
        .from('user_usage')
        .select(`
          current_usage,
          plan_id,
          plan_settings (
            max_images_per_month
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        // Se não encontrar, pode ser um usuário recém-criado antes do trigger rodar
        if (error.code === 'PGRST116') {
          setUsage({
            currentUsage: 0,
            maxQuota: 3, // Default free limit
            planId: 'free',
            isBlocked: false,
            isNearLimit: false,
            usagePercentage: 0
          });
          setIsLoading(false);
          return;
        }
        throw error;
      }

      const maxQuota = (data.plan_settings as any)?.max_images_per_month || 0;
      const currentUsage = data.current_usage || 0;
      const planId = data.plan_id;
      
      const usagePercentage = maxQuota > 0 ? (currentUsage / maxQuota) * 100 : 0;
      const isBlocked = maxQuota > 0 && currentUsage >= maxQuota;
      const isNearLimit = !isBlocked && maxQuota > 0 && usagePercentage >= 80;

      setUsage({
        currentUsage,
        maxQuota,
        planId,
        isBlocked,
        isNearLimit,
        usagePercentage
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

  return {
    usage,
    isLoadingUsage: isLoading,
    refreshUsage: fetchUsage
  };
};