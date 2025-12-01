import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader2, X } from 'lucide-react';
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

interface SupportChatProps {
    user: User;
    onClose: () => void;
}

// ID do Proprietário/Admin para quem o cliente deve enviar a mensagem.
// Para simplificar, vamos assumir que o proprietário (owner) é o principal ponto de contato.
// Em um ambiente real, isso seria buscado dinamicamente.
// Usaremos o ID do usuário 'owner' que está no contexto do Supabase (lucasformaggio@gmail.com)
const SUPPORT_USER_ID = '00000000-0000-0000-0000-000000000000'; // Placeholder, deve ser o ID do owner/admin

export const SupportChat: React.FC<SupportChatProps> = ({ user, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [supportId, setSupportId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = getSupabase();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 1. Encontra o ID do usuário de suporte (Owner/Admin)
    const findSupportUser = useCallback(async () => {
        if (!supabase) return;
        
        // Busca o primeiro usuário com a role 'owner' ou 'admin' para ser o destinatário padrão
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['owner', 'admin', 'dev'])
            .limit(1)
            .single();

        if (error || !data) {
            console.error("Nenhum usuário de suporte encontrado.");
            return null;
        }
        setSupportId(data.id);
        return data.id;
    }, [supabase]);

    // 2. Busca mensagens
    const fetchMessages = useCallback(async (clientId: string, supportId: string) => {
        if (!supabase || !supportId) return;
        setIsLoading(true);
        
        // Busca mensagens entre o cliente e o suporte
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${clientId},recipient_id.eq.${supportId}),and(sender_id.eq.${supportId},recipient_id.eq.${clientId})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
        } else {
            setMessages(data || []);
        }
        setIsLoading(false);
        scrollToBottom();
    }, [supabase]);

    useEffect(() => {
        findSupportUser().then(id => {
            if (id) {
                fetchMessages(user.id, id);
            } else {
                setIsLoading(false);
            }
        });
    }, [user.id, findSupportUser, fetchMessages]);
    
    useEffect(scrollToBottom, [messages]);

    // 3. Realtime Listener
    useEffect(() => {
        if (!supabase || !supportId) return;

        const channel = supabase
            .channel(`client_chat_${user.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat_messages',
                // Filtra mensagens destinadas ao cliente atual OU enviadas por ele
                filter: `recipient_id=eq.${user.id}` 
            }, (payload: any) => {
                const newMessage = payload.new as ChatMessage;
                // Adiciona a mensagem se ela for relevante para esta conversa (enviada pelo suporte)
                if (newMessage.sender_id === supportId) {
                    setMessages((prev) => [...prev, newMessage]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, user.id, supportId]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !supportId || !supabase) return;

        setIsSending(true);
        const messageContent = newMessage.trim();

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                sender_id: user.id,
                recipient_id: supportId,
                content: messageContent,
                is_admin_message: false, // Cliente enviando
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

    return (
        <div className="fixed bottom-4 right-4 z-[150] w-full max-w-md h-[500px] bg-zinc-900 border border-primary/20 rounded-2xl shadow-2xl flex flex-col animate-fade-in">
            
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-800/50 rounded-t-2xl">
                <h4 className="text-white font-bold flex items-center gap-2">
                    <MessageSquare size={18} className="text-primary" /> Suporte ao Cliente
                </h4>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                ) : !supportId ? (
                    <div className="text-center text-gray-500 pt-10">Nenhum agente de suporte disponível no momento.</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 pt-10">Inicie uma conversa. Nossa equipe responderá em breve.</div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex ${msg.is_admin_message ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`max-w-xs md:max-w-md p-3 rounded-xl text-sm ${
                                !msg.is_admin_message 
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-zinc-800/50 flex gap-3 rounded-b-2xl">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-grow bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none text-sm"
                    disabled={isSending || !supportId}
                />
                <Button type="submit" isLoading={isSending} disabled={!newMessage.trim() || isSending || !supportId} className="h-10 px-4">
                    <Send size={16} />
                </Button>
            </form>
        </div>
    );
};