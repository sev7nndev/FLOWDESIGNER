if (error.code === 'PGRST116') { // PGRST116 = No rows found
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