import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, UserRole } from '../types';
import { api } from '../services/api';
import { getSupabase } from '../services/supabaseClient';
import { toast } from 'sonner';

export const useAdminChat = (userRole: UserRole, currentUserId: string | undefined) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabase();
    const subscriptionRef = useRef<any>(null);

    const fetchMessages = useCallback(async () => {
        if (userRole !== 'admin' && userRole !== 'dev' && userRole !== 'owner') {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const data = await api.getChatMessages();
            setMessages(data);
        } catch (e: any) {
            console.error("Failed to fetch chat messages:", e);
            setError(e.message || "Falha ao carregar mensagens de chat.");
        } finally {
            setIsLoading(false);
        }
    }, [userRole]);

    useEffect(() => {
        fetchMessages();
        
        // Setup Realtime Subscription
        if (supabase && (userRole === 'admin' || userRole === 'dev' || userRole === 'owner')) {
            subscriptionRef.current = supabase
                .channel('chat_support')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                    const newMessage = payload.new as ChatMessage;
                    setMessages(prev => {
                        // Prevent duplicates if the message was sent by this client
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    });
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log("Subscribed to chat_messages changes.");
                    }
                });
        }

        return () => {
            if (subscriptionRef.current) {
                supabase?.removeChannel(subscriptionRef.current);
            }
        };
    }, [fetchMessages, userRole, supabase]);
    
    const sendMessage = useCallback(async (recipientId: string, content: string) => {
        if (!currentUserId) {
            toast.error("Usuário não autenticado.");
            return;
        }
        
        try {
            const newMessage = await api.sendChatMessage(recipientId, content);
            // The message will be added via the Realtime subscription, but we can add it immediately for better UX
            setMessages(prev => [...prev, newMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
            return true;
        } catch (e: any) {
            toast.error(e.message || "Falha ao enviar mensagem.");
            return false;
        }
    }, [currentUserId]);

    return {
        chatMessages: messages,
        isLoadingChat: isLoading,
        errorChat: error,
        sendMessage,
        fetchMessages,
    };
};