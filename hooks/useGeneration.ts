import { useState, useCallback, useEffect } from 'react';
import { BusinessInfo, GenerationState, GenerationStatus, User } from '../types';
import { useUsage } from './useUsage';
import { supabase } from '../services/supabaseClient';
import { getBackendUrl } from '../utils/api';

const initialState: GenerationState = {
  status: GenerationStatus.IDLE,
  result: null,
  error: null,
  history: []
};

export const useGeneration = (user: User | null) => {
  const [form, setForm] = useState<BusinessInfo>({
    companyName: '',
    phone: '',
    addressStreet: '',
    addressNumber: '',
    addressNeighborhood: '',
    addressCity: '',
    details: '',
    logo: null
  });

  const [state, setState] = useState<GenerationState>(initialState);
  const { usage, isLoading: isLoadingUsage, refreshUsage } = useUsage(user?.id);

  const handleInputChange = useCallback((field: keyof BusinessInfo, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogoUpload = useCallback((file: File) => {
    setForm(prev => ({ ...prev, logo: file }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'Você precisa estar logado para gerar imagens.' }));
      return;
    }

    if (!form.companyName || !form.details) {
      setState(prev => ({ ...prev, error: 'Preencha o nome da empresa e os detalhes do serviço.' }));
      return;
    }

    setState(prev => ({ ...prev, status: GenerationStatus.GENERATING, error: null }));

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const response = await fetch(`${getBackendUrl()}/api/generation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ promptInfo: form })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar imagem.');
      }

      setState(prev => ({
        ...prev,
        status: GenerationStatus.SUCCESS,
        result: data,
        history: [data, ...prev.history]
      }));

      // Refresh usage after successful generation
      refreshUsage();
    } catch (error: any) {
      console.error('Generation error:', error);
      setState(prev => ({
        ...prev,
        status: GenerationStatus.ERROR,
        error: error.message || 'Ocorreu um erro ao gerar a imagem.'
      }));
    }
  }, [user, form, refreshUsage]);

  const loadExample = useCallback(() => {
    setForm({
      companyName: 'Calors Automóveis',
      phone: '(21) 99999-9999',
      addressStreet: 'Av. Principal',
      addressNumber: '123',
      addressNeighborhood: 'Centro',
      addressCity: 'Rio de Janeiro',
      details: 'Especialista em lanternagem, pintura e funilaria. Promoção de alinhamento e balanceamento por R$ 80. Trabalhamos com seguros e consórcios.',
      logo: null
    });
  }, []);

  const loadHistory = useCallback(async () => {
    if (!user) return;

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (!token) return;

      const response = await fetch(`${getBackendUrl()}/api/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        setState(prev => ({ ...prev, history }));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, [user]);

  const downloadImage = useCallback(async (imageUrl: string, filename: string = 'flow-design.png') => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  }, []);

  // Load history on mount
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, loadHistory]);

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
    isLoadingUsage
  };
};