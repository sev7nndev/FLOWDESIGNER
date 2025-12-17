import useSWR from 'swr';
import { api } from '../services/api';
import { QuotaStatus, UserRole } from '../types';

export const useUsage = (userId: string | undefined, userRole: UserRole | undefined) => {

    // 1. Fetch Plans (Public, Cache Forever basically)
    const {
        data: plans = [],
        isLoading: isPlansLoading
    } = useSWR('plans', api.getPlanSettings, {
        revalidateOnFocus: false, // Plans hardly change
        dedupingInterval: 60000 * 60 // 1 hour cache
    });

    // 2. Fetch Quota (User specific)
    const {
        data: quota,
        error: quotaError,
        isLoading: isQuotaLoading,
        mutate
    } = useSWR(
        userId ? '/api/check-quota' : null,
        () => api.checkQuota().catch(() => null),
        {
            revalidateOnFocus: false,
            dedupingInterval: 5000
        }
    );

    // Derived Logic (Matches original manual logic)
    const currentPlan = plans.find(p => p.id === quota?.usage?.plan_id)
        || plans.find(p => p.id === userRole);

    let maxImages = 0;
    if (quota?.plan?.max_images_per_month) {
        maxImages = quota.plan.max_images_per_month;
    } else if (userRole && plans.length > 0) {
        const fallbackPlan = plans.find(p => p.id === userRole);
        maxImages = fallbackPlan?.max_images_per_month || 0;
    }

    const currentUsage = (quota as any)?.usage?.current_usage || 0;
    const usagePercentage = maxImages > 0
        ? (currentUsage / maxImages) * 100
        : 0;

    return {
        plans,
        quota: quota || null,
        isLoading: isPlansLoading || (!!userId && isQuotaLoading),
        error: quotaError ? 'Erro ao carregar saldo' : null,
        currentPlan,
        usagePercentage,
        refreshUsage: mutate, // Compatible with previous interface
        quotaStatus: quota?.status || QuotaStatus.ALLOWED,
        currentUsage,
        maxImages
    };
};