import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../services/supabase';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const POLLING_INTERVAL = 3000; // 3 seconds
const POLLING_TIMEOUT = 60000; // 60 seconds

interface GeneratedImage {
  url: string;
  prompt: string;
}

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

export const useGeneration = () => {
  const { user, session } = useAuth();
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData>(initialUsage);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  const clearGeneration = () => {
    setGeneratedImage(null);
    setGenerationError(null);
  };

  // --- Usage Fetching ---
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(initialUsage);
      setIsLoadingUsage(false);
      return;
    }

    setIsLoadingUsage(true);
    try {
      // Fetch usage data from the new backend endpoint
      const response = await axios.get(`${API_BASE_URL}/usage/${user.id}`);
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setUsage(initialUsage); // Fallback to default
    } finally {
      setIsLoadingUsage(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // --- Polling Logic ---
  const pollJobStatus = useCallback(
    (jobId: string, prompt: string, startTime: number) => {
      const intervalId = setInterval(async () => {
        if (Date.now() - startTime > POLLING_TIMEOUT) {
          clearInterval(intervalId);
          setIsGenerating(false);
          setGenerationError('Image generation timed out. Please try again later.');
          return;
        }

        try {
          const token = session?.access_token;
          if (!token) throw new Error('No session token available.');

          const response = await axios.get(`${API_BASE_URL}/generation/status/${jobId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const { status, imageUrl, error: jobError } = response.data;

          if (status === 'COMPLETE' && imageUrl) {
            clearInterval(intervalId);
            setGeneratedImage({ url: imageUrl, prompt });
            setIsGenerating(false);
            fetchUsage(); // Refresh usage count after successful generation
          } else if (status === 'FAILED') {
            clearInterval(intervalId);
            setIsGenerating(false);
            setGenerationError(jobError || 'Image generation failed on the server side.');
            fetchUsage(); // Refresh usage count
          }
          // If status is PENDING, continue polling
        } catch (error: any) {
          clearInterval(intervalId);
          setIsGenerating(false);
          setGenerationError(error.response?.data?.error || 'Failed to check job status.');
        }
      }, POLLING_INTERVAL);

      return () => clearInterval(intervalId);
    },
    [session, fetchUsage]
  );

  // --- Generation Initiation ---
  const generateImage = useCallback(
    async (businessInfo: string) => {
      if (!user || !session) {
        setGenerationError('You must be logged in to generate images.');
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);

      try {
        const token = session.access_token;

        // 1. Initiate generation job on the backend
        const response = await axios.post(
          `${API_BASE_URL}/generation/generate`,
          { businessInfo },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const { jobId } = response.data;
        const startTime = Date.now();

        // 2. Start polling for the job status
        pollJobStatus(jobId, businessInfo, startTime);
      } catch (error: any) {
        setIsGenerating(false);
        // Handle specific quota error from the backend
        if (error.response?.status === 403 && error.response?.data?.error.includes('Quota Reached')) {
            setGenerationError(error.response.data.error);
        } else {
            setGenerationError(error.response?.data?.error || 'Failed to start generation job.');
        }
        fetchUsage(); // Ensure usage is refreshed in case of an error
      }
    },
    [user, session, pollJobStatus, fetchUsage]
  );

  return {
    generatedImage,
    isGenerating,
    generationError,
    generateImage,
    clearGeneration,
    usage,
    isLoadingUsage,
  };
};