import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader2, User as UserIcon } from 'lucide-react';
import { Button } from './ui/Button'; // Corrigido
import { getSupabase } from '../services/supabaseClient';
import { User } from '../types';

interface Client {
    id: string;
    name: string;
    email: string;
}

interface ChatMessage {
    id: string;
    created_at: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    is_admin_message: boolean;
}

interface OwnerChatPanelProps {
    owner: User;
    clients: Client[];
}

export const OwnerChatPanel: React.FC<OwnerChatPanelProps> = ({ owner, clients }) => {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = getSupabase();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = useCallback(async (clientId: string) => {
        if (!supabase || !clientId) return;
        setIsLoading(true);
        
        // Busca mensagens entre o owner e o cliente
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${owner.id},recipient_id.eq.${clientId}),and(sender_id.eq.${clientId},recipient_id.eq.${owner.id})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
        } else {
            setMessages(data || []);
        }
        setIsLoading(false);
        scrollToBottom();
    }, [supabase, owner.id]);

    useEffect(() => {
        if (selectedClient) {
            fetchMessages(selectedClient.id);
        } else {
            setMessages([]);
        }
    }, [selectedClient, fetchMessages]);
    
    useEffect(scrollToBottom, [messages]);

    // Realtime Listener
    useEffect(() => {
        if (!supabase || !owner.id) return;

        const channel = supabase
            .channel('owner_chat')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat_messages',
                filter: `recipient_id=eq.${owner.id}` // Filtra mensagens destinadas ao owner
            }, (payload) => {
                const newMessage = payload.new as ChatMessage;
                // Atualiza apenas se a mensagem for do cliente selecionado
                if (selectedClient && (newMessage.sender_id === selectedClient.id || newMessage.recipient_id === selectedClient.id)) {
                    setMessages((prev) => [...prev, newMessage]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, owner.id, selectedClient]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedClient || !supabase) return;

        setIsSending(true);
        const messageContent = newMessage.trim();

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                sender_id: owner.id,
                recipient_id: selectedClient.id,
                content: messageContent,
                is_admin_message: true,
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[70vh] min-h-[500px]">
            {/* Lista de Clientes */}
            <div className="lg:col-span-1 bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                <h4 className="p-4 text-white font-bold border-b border-white/10 flex items-center gap-2">
                    <UserIcon size={18} className="text-primary" /> Clientes ({clients.length})
                </h4>
                <div className="overflow-y-auto custom-scrollbar flex-grow">
                    {clients.map((client) => (
                        <button
                            key={client.id}
                            onClick={() => setSelectedClient(client)}
                            className={`w-full text-left p-3 border-b border-white/5 transition-colors ${
                                selectedClient?.id === client.id ? 'bg-primary/20 border-primary/50' : 'hover:bg-white/5'
                            }`}
                        >
                            <p className="text-sm font-medium text-white truncate">{client.name}</p>
                            <p className="text-xs text-gray-400 truncate">{client.email}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Painel de Chat */}
            <div className="lg:col-span-3 bg-zinc-900/50 border border-white/10 rounded-xl flex flex-col">
                {selectedClient ? (
                    <>
                        <div className="p-4 border-b border-white/10 bg-zinc-800/50">
                            <h4 className="text-white font-bold">{selectedClient.name}</h4>
                            <p className="text-xs text-gray-400">Conversando com o cliente ({selectedClient.plan})</p>
                        </div>

                        {/* Área de Mensagens */}
                        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-500 pt-10">Nenhuma mensagem nesta conversa.</div>
                            ) : (
                                messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={`flex ${msg.is_admin_message ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-xl text-sm ${
                                            msg.is_admin_message 
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
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare size={48} className="mb-4 opacity-30" />
                        <p>Selecione um cliente para iniciar o chat.</p>
                    </div>
                )}
            </div>
        </div>
    );
};