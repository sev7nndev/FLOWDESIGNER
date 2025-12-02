export const getBackendUrl = (): string => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (import.meta.env.BACKEND_URL) {
    return import.meta.env.BACKEND_URL;
  }
  return 'http://localhost:3001';
};

export const getSupabaseUrl = (): string => {
  if (import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  if (import.meta.env.SUPABASE_URL) {
    return import.meta.env.SUPABASE_URL;
  }
  throw new Error('Supabase URL not found in environment variables');
};

export const createApiHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};