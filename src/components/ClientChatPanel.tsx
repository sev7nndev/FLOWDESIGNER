import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader2, User as UserIcon, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { getSupabase } from '../services/supabaseClient';
import { User } from '../types';

interface ChatMessage {
    id: string;
    created_at: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    is_admin_message: boolean;
}

interface ClientChatPanelProps {
    user: User;
}

export const ClientChatPanel: React.FC<ClientChatPanelProps> = ({ user }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = getSupabase();
    
    const [ownerId, setOwnerId] = useState<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchOwnerId = useCallback(async () => {
        if (!supabase) return;
        // Busca o ID do primeiro usuário com role 'owner' ou 'admin'
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .or('role.eq.owner,role.eq.admin')
            .limit(1)
            .single();
            
        if (error || !data) {
            console.error("Could not find owner/admin ID for chat:", error);
            setOwnerId(null);
        } else {
            setOwnerId(data.id);
        }
    }, [supabase]);
    
    useEffect(() => {
        fetchOwnerId();
    }, [fetchOwnerId]);


    const fetchMessages = useCallback(async () => {
        if (!supabase || !ownerId) return;
        setIsLoading(true);
        
        // Busca mensagens entre o user e o owner
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${ownerId}),and(sender_id.eq.${ownerId},recipient_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
        } else {
            setMessages(data || []);
        }
        setIsLoading(false);
        scrollToBottom();
    }, [supabase, user.id, ownerId]);

    useEffect(() => {
        if (ownerId) {
            fetchMessages();
        }
    }, [ownerId, fetchMessages]);
    
    useEffect(scrollToBottom, [messages]);

    // Realtime Listener
    useEffect(() => {
        if (!supabase || !user.id || !ownerId) return;

        const channel = supabase
            .channel('client_chat')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat_messages',
                filter: `recipient_id=eq.${user.id}` // Filtra mensagens destinadas ao cliente
            }, (payload: { new: ChatMessage }) => {
                const newMessage = payload.new as ChatMessage;
                if (newMessage.sender_id === ownerId) {
                    setMessages((prev) => [...prev, newMessage]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, user.id, ownerId]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !ownerId || !supabase) return;

        setIsSending(true);
        const messageContent = newMessage.trim();

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                sender_id: user.id,
                recipient_id: ownerId,
                content: messageContent,
                is_admin_message: false, // Mensagem do cliente
            })
            .select()
            .single();

        if (error) {
            console.error("Error sending message:", error);
        } else if (data) {
            setMessages((prev) => [...prev, data]);
            setNewMessage('');
        }
        setIsSending(false);
    };

    if (!ownerId) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-zinc-900/50 rounded-xl border border-white/10">
                <Loader2 size={24} className="animate-spin text-primary mb-4" />
                <p>Buscando canal de suporte...</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl flex flex-col h-[60vh] min-h-[400px] shadow-xl">
            <div className="p-4 border-b border-white/10 bg-zinc-800/50 flex items-center gap-3">
                <MessageSquare size={20} className="text-primary" />
                <h4 className="text-white font-bold">Suporte Flow Designer</h4>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 pt-10">
                        <p>Inicie uma conversa. Nossa equipe de suporte responderá em breve.</p>
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
                    placeholder="Digite sua mensagem..."
                    className="flex-grow bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none text-sm"
                    disabled={isSending}
                />
                <Button type="submit" isLoading={isSending} disabled={!newMessage.trim() || isSending} className="h-10 px-4">
                    <Send size={16} />
                </Button>
            </form>
        </div>
    );
};