import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../services/supabaseClient';
import { toast } from 'sonner';
import { ChatMessage } from '../types'; // Importando ChatMessage

// Tipagem para uma única mensagem
interface Message {
  id: string; // Alterado para string para corresponder ao UUID do banco
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
  sendMessage: (recipientId: string, content: string) => Promise<void>; // Nova função
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
  
  const sendMessage = useCallback(async (recipientId: string, content: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: content,
          is_admin_message: true, // Owner/Admin/Dev message
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Atualiza o estado localmente para feedback imediato
      const newMessage: Message = {
        id: data.id,
        sender: 'owner',
        text: data.content,
        timestamp: data.created_at
      };
      
      setChatHistory(prevHistory => prevHistory.map(thread => {
        if (thread.id === recipientId) {
          return {
            ...thread,
            messages: [...thread.messages, newMessage],
            lastMessage: {
              text: newMessage.text,
              timestamp: newMessage.timestamp,
              sender: 'owner'
            }
          };
        }
        return thread;
      }));
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      toast.error(`Falha ao enviar mensagem: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);
  
  // Realtime Listener para mensagens de clientes
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    const channel = supabase
        .channel(`owner_chat_updates`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages',
            // Filtra mensagens enviadas por clientes (is_admin_message = false)
            filter: `is_admin_message.eq.false` 
        }, (payload: any) => {
            const newMessage = payload.new as ChatMessage;
            
            // Atualiza o histórico
            setChatHistory(prevHistory => {
                const senderId = newMessage.sender_id;
                const updatedHistory = prevHistory.map(thread => {
                    if (thread.id === senderId) {
                        const newMsg: Message = {
                            id: newMessage.id,
                            sender: 'client',
                            text: newMessage.content,
                            timestamp: newMessage.created_at
                        };
                        return {
                            ...thread,
                            messages: [...thread.messages, newMsg],
                            lastMessage: {
                                text: newMsg.text,
                                timestamp: newMsg.timestamp,
                                sender: 'client'
                            },
                            unreadCount: thread.unreadCount + 1 // Incrementa não lidas
                        };
                    }
                    return thread;
                });
                
                // Se a mensagem for de um cliente que não está na lista (novo chat)
                // Isso é complexo de resolver sem buscar o perfil do cliente aqui.
                // Por enquanto, confiamos que o cliente já está na lista de 'clients' do owner panel.
                
                return updatedHistory;
            });
            
            toast.info(`Nova mensagem de cliente!`);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);


  return {
    chatHistory,
    isLoading,
    error,
    refreshHistory: fetchChatHistory,
    sendMessage
  };
};