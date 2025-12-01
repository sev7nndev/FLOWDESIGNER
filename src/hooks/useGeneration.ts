import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSupabase } from '../services/supabaseClient';
import axios from 'axios';
import { GeneratedImage, BusinessInfo, GenerationStatus } from '../types';
import { PLACEHOLDER_EXAMPLES, ART_STYLES } from '../constants';
import { api } from '../services/api';

const API_BASE_URL = '/api';
const POLLING_INTERVAL = 3000;
const POLLING_TIMEOUT = 60000;

// Tipagem exportada para uso em outros componentes
export interface UsageData {
  role: string;
  current: number;
  limit: number;
  isUnlimited: boolean;
}

const initialUsage: UsageData = {
  role: 'free',
  current: 0,
  limit: 5,
  isUnlimited: false,
};

const initialFormState: BusinessInfo = {
    companyName: '',
    phone: '',
    addressStreet: '',
    addressNumber: '',
    addressNeighborhood: '',
    addressCity: '',
    details: '',
    logo: '',
    styleId: ART_STYLES[0].id, // Default to the first style
};

const initialGenerationState = {
    status: GenerationStatus.IDLE,
    currentImage: null,
    history: [],
    error: undefined,
    debugPrompt: undefined,
};

export const useGeneration = (user: any) => {
  const { session } = useAuth();
  const [form, setForm] = useState<BusinessInfo>(initialFormState);
  const [state, setState] = useState<{
    status: GenerationStatus;
    currentImage: GeneratedImage | null;
    history: GeneratedImage[];
    error?: string;
    debugPrompt?: string;
  }>(initialGenerationState);
  
  const [usage, setUsage] = useState<UsageData>(initialUsage);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  const clearGeneration = () => {
    setState(prev => ({ ...prev, currentImage: null, error: undefined, status: GenerationStatus.IDLE }));
  };

  const handleInputChange = useCallback((field: keyof BusinessInfo, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const loadExample = useCallback(() => {
    const example = PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)];
    setForm(prev => ({ ...prev, ...example }));
  }, []);
  
  const handleLogoUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        // Limita o tamanho do base64 para evitar sobrecarga no backend (30KB max)
        const base64String = reader.result as string;
        const MAX_SIZE_BASE64 = 40000; // ~30KB
        if (base64String.length > MAX_SIZE_BASE64) {
            setState(prev => ({ ...prev, error: `O logo é muito grande. O tamanho máximo permitido é de ${Math.round(MAX_SIZE_BASE64 / 1.33 / 1024)}KB.` }));
            setForm(prev => ({ ...prev, logo: '' }));
            return;
        }
        setForm(prev => ({ ...prev, logo: base64String }));
        setState(prev => ({ ...prev, error: undefined }));
    };
    reader.readAsDataURL(file);
  }, []);

  // --- History Fetching ---
  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
        const history = await api.getHistory();
        setState(prev => ({ ...prev, history }));
    } catch (e) {
        console.error("Failed to load history:", e);
    }
  }, [user]);

  // --- Usage Fetching ---
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(initialUsage);
      setIsLoadingUsage(false);
      return;
    }

    setIsLoadingUsage(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/usage/${user.id}`);
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setUsage(initialUsage);
    } finally {
      setIsLoadingUsage(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // --- Polling Logic ---
  const pollJobStatus = useCallback(
    (jobId: string, startTime: number) => {
      const intervalId = setInterval(async () => {
        if (Date.now() - startTime > POLLING_TIMEOUT) {
          clearInterval(intervalId);
          setState(prev => ({ ...prev, status: GenerationStatus.ERROR, error: 'Image generation timed out. Please try again later.' }));
          return;
        }

        try {
          const token = session?.access_token;
          if (!token) throw new Error('No session token available.');

          const response = await axios.get(`${API_BASE_URL}/generation/job-status/${jobId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const { status, imageUrl, error: jobError } = response.data;

          if (status === 'COMPLETE' && imageUrl) {
            clearInterval(intervalId);
            
            // Força o recarregamento do histórico para obter o objeto GeneratedImage completo
            await loadHistory(); 
            
            // Encontra a imagem recém-gerada no histórico (a mais recente)
            const latestImage = (await api.getHistory()).find(img => img.url === imageUrl);

            setState(prev => ({ 
                ...prev, 
                status: GenerationStatus.SUCCESS, 
                currentImage: latestImage || { id: 'temp', url: imageUrl, prompt: 'Generated Image', businessInfo: form, createdAt: Date.now() },
                error: undefined
            }));
            
            fetchUsage();
          } else if (status === 'FAILED') {
            clearInterval(intervalId);
            setState(prev => ({ ...prev, status: GenerationStatus.ERROR, error: jobError || 'Image generation failed on the server side.' }));
            fetchUsage();
          }
          // If status is PENDING, continue polling
        } catch (error: any) {
          clearInterval(intervalId);
          setState(prev => ({ ...prev, status: GenerationStatus.ERROR, error: error.response?.data?.error || 'Failed to check job status.' }));
        }
      }, POLLING_INTERVAL);

      return () => clearInterval(intervalId);
    },
    [session, fetchUsage, loadHistory, form]
  );

  // --- Generation Initiation ---
  const handleGenerate = useCallback(
    async () => {
      if (!user || !session) {
        setState(prev => ({ ...prev, error: 'You must be logged in to generate images.' }));
        return;
      }
      
      if (!form.companyName || !form.details) {
          setState(prev => ({ ...prev, error: 'Nome da empresa e detalhes são obrigatórios.' }));
          return;
      }

      setState(prev => ({ ...prev, status: GenerationStatus.THINKING, error: undefined }));

      try {
        const token = session.access_token;

        // 1. Initiate generation job on the backend
        const response = await axios.post(
          `${API_BASE_URL}/generation/generate`,
          { promptInfo: form }, // Enviando o objeto BusinessInfo completo
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const { jobId } = response.data;
        const startTime = Date.now();
        
        setState(prev => ({ ...prev, status: GenerationStatus.GENERATING }));

        // 2. Start polling for the job status
        pollJobStatus(jobId, startTime);
      } catch (error: any) {
        setState(prev => ({ ...prev, status: GenerationStatus.ERROR }));
        if (error.response?.status === 403 && error.response?.data?.error.includes('Quota Reached')) {
            setState(prev => ({ ...prev, error: error.response.data.error }));
        } else {
            setState(prev => ({ ...prev, error: error.response?.data?.error || 'Failed to start generation job.' }));
        }
        fetchUsage();
      }
    },
    [user, session, pollJobStatus, fetchUsage, form]
  );
  
  const downloadImage = useCallback((image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `flow-designer-${image.id}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    form,
    state,
    handleInputChange,
    handleLogoUpload,
    handleGenerate,
    loadExample,
    loadHistory,
    downloadImage,
    usage,
    isLoadingUsage,
  };
};