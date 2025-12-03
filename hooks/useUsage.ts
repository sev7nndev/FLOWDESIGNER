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
    
    // Helper to get current plan details
    const currentPlan = state.plans.find(p => p.id === state.quota?.usage.plan_id);
    
    // Helper to calculate usage percentage
    const usagePercentage = state.quota && currentPlan
        ? (state.quota.usage.current_usage / currentPlan.max_images_per_month) * 100
        : 0;

    return {
        ...state,
        currentPlan,
        usagePercentage,
        refreshUsage,
        quotaStatus: state.quota?.status || QuotaStatus.ALLOWED,
        currentUsage: state.quota?.usage.current_usage || 0,
        maxImages: currentPlan?.max_images_per_month || 0,
    };
};