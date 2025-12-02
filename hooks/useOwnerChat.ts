import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../services/supabaseClient';
import { toast } from 'sonner';

// Tipagem para uma única mensagem
interface Message {
  id: number;
  sender: 'owner' | 'client';
  text: string;
  timestamp: string;
}

// Tipagem para um thread de chat com um cliente
export interface ChatThread {
  id: string;
  name: string;
  lastMessage: {
    text: string;
    timestamp: string;
    sender: 'owner' | 'client';
  };
  unreadCount: number;
  messages: Message[];
}

interface UseOwnerChatResult {
  chatHistory: ChatThread[];
  isLoading: boolean;
  error: string | null;
  refreshHistory: () => void;
}

export const useOwnerChat = (): UseOwnerChatResult => {
  const [chatHistory, setChatHistory] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChatHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase client not initialized.");
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("User not authenticated.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/owner/chat-history', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chat history.');
      }

      const data: ChatThread[] = await response.json();
      setChatHistory(data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Erro ao carregar chat: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  return {
    chatHistory,
    isLoading,
    error,
    refreshHistory: fetchChatHistory,
  };
};