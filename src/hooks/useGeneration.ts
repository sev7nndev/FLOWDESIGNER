// ... (imports)

export const useGeneration = (user: any) => {
  const { session } = useAuth();
// ... (state definitions)

  // --- Usage Fetching ---
  const fetchUsage = useCallback(async () => {
    if (!user || !session) { // Check for session too
      setUsage(initialUsage);
      setIsLoadingUsage(false);
      return;
    }

    setIsLoadingUsage(true);
    try {
      // Fetch usage data from the new backend endpoint
      const response = await axios.get(`${API_BASE_URL}/usage/${user.id}`, {
        headers: {
          // CRITICAL FIX: Pass the Authorization token
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setUsage(initialUsage); // Fallback to default
    } finally {
      setIsLoadingUsage(false);
    }
  }, [user, session]); // Dependency on session added

// ... (rest of the hook)