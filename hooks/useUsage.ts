import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { PlanSetting, QuotaCheckResponse, QuotaStatus, UserUsage, UserRole, EditablePlan } from '../types';

interface UsageState {
    plans: EditablePlan[]; // Changed to EditablePlan
    quota: QuotaCheckResponse | null;
    isLoading: boolean;
    error: string | null;
}

const INITIAL_STATE: UsageState = {
    plans: [],
    quota: null,
    isLoading: true,
    error: null,
};

export const useUsage = (userId: string | undefined) => {
    const [state, setState] = useState<UsageState>(INITIAL_STATE);

    const fetchUsageData = useCallback(async () => {
        if (!userId) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const [plans, quota] = await Promise.all([
                api.getPlanSettings(),
                api.checkQuota()
            ]);

            setState({
                plans,
                quota,
                isLoading: false,
                error: null,
            });
        } catch (e: any) {
            console.error("Failed to fetch usage data:", e);
            setState(prev => ({ 
                ...prev, 
                isLoading: false, 
                error: e.message || 'Falha ao carregar dados de uso e planos.' 
            }));
        }
    }, [userId]);
    
    const refreshUsage = useCallback(() => {
        fetchUsageData();
    }, [fetchUsageData]);

    useEffect(() => {
        fetchUsageData();
    }, [fetchUsageData]);
    
    // 1. Tenta encontrar o plano completo (com display_name e features)
    const currentPlan = state.plans.find(p => p.id === state.quota?.usage.plan_id);
    
    // 2. Define o limite máximo de imagens, usando o plano completo ou o limite retornado pelo quota (backend) como fallback.
    const maxImages = currentPlan?.max_images_per_month || state.quota?.plan.max_images_per_month || 0;
    
    // 3. Calcula a porcentagem de uso
    const usagePercentage = state.quota && maxImages > 0
        ? (state.quota.usage.current_usage / maxImages) * 100
        : 0;

    return {
        ...state,
        currentPlan,
        usagePercentage,
        refreshUsage,
        quotaStatus: state.quota?.status || QuotaStatus.ALLOWED,
        currentUsage: state.quota?.usage.current_usage || 0,
        maxImages: maxImages, // Usando o valor calculado
    };
};