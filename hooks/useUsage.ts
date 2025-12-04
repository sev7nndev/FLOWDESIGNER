import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { QuotaCheckResponse, QuotaStatus, UserRole, EditablePlan } from '../types';

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

export const useUsage = (userId: string | undefined, userRole: UserRole | undefined) => {
    const [state, setState] = useState<UsageState>(INITIAL_STATE);

    const fetchUsageData = useCallback(async () => {
        // PLANS are public, so we fetch them regardless of userId

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        let plans: EditablePlan[] = [];
        let quota: QuotaCheckResponse | null = null;
        let fetchError: string | null = null;

        try {
            // 1. Fetch Plans (Publicly accessible)
            plans = await api.getPlanSettings();
        } catch (e: any) {
            console.error("Failed to fetch plan settings:", e);
            fetchError = e.message || 'Falha ao carregar configurações de planos.';
        }

        if (userId) {
            try {
                // 2. Fetch Quota (Requires Auth)
                quota = await api.checkQuota();
            } catch (e: any) {
                console.error("Failed to fetch quota:", e);
                // If quota check fails, we still want to display the plan limit if we have the plan list
                // Only overwrite error if plans also failed, or append? 
                // Prioritize plan error if it exists.
                if (!fetchError) {
                    fetchError = e.message || 'Falha ao verificar quota de uso.';
                }
            }
        }

        setState({
            plans,
            quota,
            isLoading: false,
            error: fetchError,
        });
    }, [userId]);

    const refreshUsage = useCallback(() => {
        fetchUsageData();
    }, [fetchUsageData]);

    useEffect(() => {
        fetchUsageData();
    }, [fetchUsageData]);

    // 1. Tenta encontrar o plano completo (com display_name e features)
    // Fix: Safely access usage and plan_id
    const currentPlan = state.plans.find(p => p.id === state.quota?.usage?.plan_id);

    // 2. Define o limite máximo de imagens.
    // Priority: 
    // a) Limit from successful quota check (state.quota.plan.max_images_per_month)
    // b) Limit from the full plan list based on the user's current role (passed as prop)
    // c) 0 as final fallback

    let maxImages = 0;
    // Fix: Check for plan existence safely
    if (state.quota?.plan?.max_images_per_month) {
        maxImages = state.quota.plan.max_images_per_month;
    } else if (userRole && state.plans.length > 0) {
        // Fallback using the role passed from App.tsx (which comes from useProfile)
        const fallbackPlan = state.plans.find(p => p.id === userRole);
        maxImages = fallbackPlan?.max_images_per_month || 0;
    }

    // 3. Calcula a porcentagem de uso
    // Fix: Safely access current_usage
    const usagePercentage = state.quota?.usage && maxImages > 0
        ? (state.quota.usage.current_usage / maxImages) * 100
        : 0;

    return {
        ...state,
        currentPlan: currentPlan || state.plans.find(p => p.id === userRole), // Ensure currentPlan is defined if plans were fetched
        usagePercentage,
        refreshUsage,
        quotaStatus: state.quota?.status || QuotaStatus.ALLOWED,
        currentUsage: state.quota?.usage?.current_usage || 0,
        maxImages: maxImages, // Usando o valor calculado
    };
};