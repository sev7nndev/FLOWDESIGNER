import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare, ArrowLeft, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from './Button';
import { getSupabase } from '../services/supabaseClient';
import { User, ChatMessage } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

interface ClientChatPanelProps {
    user: User;
    onBack: () => void;
    onLogout: () => void; // Adicionando prop de logout
}

export const ClientChatPanel: React.FC<ClientChatPanelProps> = ({ user, onBack, onLogout }) => {
    const [recipientId, setRecipientId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = getSupabase();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 1. Fetch Recipient ID (Owner/Admin/Dev)
    useEffect(() => {
        api.getSupportRecipientId()
            .then(id => {
                setRecipientId(id);
                setError(null);
            })
            .catch(e => {
                setError(e.message || "Falha ao encontrar contato de suporte.");
                setIsLoading(false);
            });
    }, []);

    // 2. Fetch Messages
    const fetchMessages = useCallback(async (clientId: string, supportId: string) => {
        if (!supabase || !clientId || !supportId) return;
        setIsLoading(true);
        
        // Busca mensagens entre o cliente (clientId) e o suporte (supportId)
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${clientId},recipient_id.eq.${supportId}),and(sender_id.eq.${supportId},recipient_id.eq.${clientId})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            setError("Falha ao carregar mensagens.");
        } else {
            setMessages(data || []);
        }
        setIsLoading(false);
        scrollToBottom();
    }, [supabase]);

    useEffect(() => {
        if (recipientId) {
            fetchMessages(user.id, recipientId);
        }
    }, [recipientId, user.id, fetchMessages]);
    
    useEffect(scrollToBottom, [messages]);

    // 3. Realtime Listener
    useEffect(() => {
        if (!supabase || !recipientId) return;

        const channel = supabase
            .channel(`client_chat_${user.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat_messages',
                // Filtra mensagens enviadas pelo suporte OU destinadas ao cliente
                filter: `or(sender_id.eq.${recipientId},recipient_id.eq.${user.id})` 
            }, (payload: any) => {
                const newMessage = payload.new as ChatMessage;
                // Garante que a mensagem seja relevante para esta conversa
                const isRelevant = (newMessage.sender_id === user.id && newMessage.recipient_id === recipientId) || 
                                 (newMessage.sender_id === recipientId && newMessage.recipient_id === user.id);
                                 
                if (isRelevant) {
                    setMessages((prev) => [...prev, newMessage]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, user.id, recipientId]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !recipientId || !supabase) return;

        setIsSending(true);
        const messageContent = newMessage.trim();

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                sender_id: user.id,
                recipient_id: recipientId,
                content: messageContent,
                is_admin_message: false, // Client message
            })
            .select()
            .single();

        if (error) {
            console.error("Error sending message:", error);
            toast.error("Falha ao enviar mensagem.");
        } else if (data) {
            // A mensagem será adicionada via listener em tempo real, mas adicionamos aqui para feedback imediato
            // NOTE: Removendo a adição manual aqui para evitar duplicação se o listener for rápido.
            setNewMessage('');
        }
        setIsSending(false);
    };
    
    const supportName = "Suporte Flow Designer";
    const isChatReady = recipientId && !isLoading;

    return (
        <div className="min-h-screen bg-zinc-950 text-gray-100 pt-20 pb-16 relative">
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
            
            <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10 h-[80vh] flex flex-col bg-zinc-900/80 border border-white/10 rounded-xl shadow-2xl">
                
                {/* Header do Chat */}
                <div className="p-4 border-b border-white/10 bg-zinc-800/50 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="text-gray-400 hover:text-white p-1 rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <MessageSquare size={24} className="text-primary" />
                        <div>
                            <h4 className="text-white font-bold">Chat de Suporte</h4>
                            <p className="text-xs text-gray-400">Conversando com {supportName}</p>
                        </div>
                    </div>
                    <Button variant="danger" onClick={onLogout} className="h-8 px-3 text-xs" icon={<LogOut size={14} />}>
                        Sair
                    </Button>
                </div>

                {/* Área de Mensagens */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {error ? (
                        <div className="text-center text-red-400 pt-10">
                            <AlertTriangle size={24} className="mx-auto mb-2" />
                            {error}
                        </div>
                    ) : isLoading || !recipientId ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 size={24} className="animate-spin text-primary" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 pt-10">
                            <p>Inicie sua conversa. O suporte responderá em breve.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-xs md:max-w-md p-3 rounded-xl text-sm ${
                                    msg.sender_id === user.id 
                                        ? 'bg-primary text-white rounded-br-none' 
                                        : 'bg-zinc-700 text-white rounded-tl-none'
                                }`}>
                                    {msg.content}
                                    <span className="block text-[10px] text-right mt-1 opacity-70">
                                        {new Date(msg.created_at).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Formulário de Envio */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-zinc-800/50 flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem para o suporte..."
                        className="flex-grow bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none text-sm"
                        disabled={isSending || !isChatReady} // Desabilita se estiver enviando ou se o chat não estiver pronto
                    />
                    <Button 
                        type="submit" 
                        isLoading={isSending} 
                        disabled={!newMessage.trim() || isSending || !isChatReady} 
                        className="h-10 px-4"
                    >
                        <Send size={16} />
                    </Button>
                </form>
            </div>
        </div>
    );
};