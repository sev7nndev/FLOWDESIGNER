import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../Button';
import { useAdminChat } from '@/hooks/useAdminChat';
import { AdminUser, ChatMessage, User } from '@/types';

export const AdminChat: React.FC<{ user: User, adminUsers: AdminUser[] }> = ({ user, adminUsers }) => {
    const { chatMessages, isLoadingChat, errorChat, sendMessage } = useAdminChat(user.role, user.id);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [messageContent, setMessageContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const clients = useMemo(() => adminUsers.filter(u => u.role !== 'admin' && u.role !== 'dev' && u.role !== 'owner'), [adminUsers]);
    
    const conversations = useMemo(() => {
        const convs: Record<string, ChatMessage[]> = {};
        chatMessages.forEach(msg => {
            const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
            if (!convs[otherId]) convs[otherId] = [];
            convs[otherId].push(msg);
        });
        return convs;
    }, [chatMessages, user.id]);
    
    const currentConversation = selectedUserId ? conversations[selectedUserId] || [] : [];
    const selectedClient = clients.find(c => c.id === selectedUserId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [currentConversation]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !messageContent.trim()) return;
        
        const success = await sendMessage(selectedUserId, messageContent.trim());
        if (success) {
            setMessageContent('');
        }
    };
    
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <MessageSquare size={20} className="text-yellow-400" /> Chat de Suporte
            </h3>
            
            {isLoadingChat && <div className="text-center py-10"><Loader2 size={20} className="animate-spin text-yellow-400" /></div>}
            {errorChat && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{errorChat}</div>}

            <div className="flex h-[500px] border border-white/10 rounded-lg overflow-hidden">
                {/* Lista de Clientes */}
                <div className="w-full md:w-1/3 bg-zinc-800/50 overflow-y-auto custom-scrollbar">
                    <div className="p-3 border-b border-white/10 sticky top-0 bg-zinc-800/80 backdrop-blur-sm">
                        <p className="text-sm font-semibold text-white">Clientes ({clients.length})</p>
                    </div>
                    {clients.map(client => (
                        <div 
                            key={client.id} 
                            onClick={() => setSelectedUserId(client.id)}
                            className="p-3 border-b border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                        >
                            <p className="text-sm font-medium text-white truncate">{client.first_name || client.email}</p>
                            <p className="text-xs text-gray-400">{client.role}</p>
                        </div>
                    ))}
                </div>
                
                {/* Área de Conversa */}
                <div className="w-full md:w-2/3 flex flex-col bg-zinc-900">
                    {!selectedUserId ? (
                        <p className="flex items-center justify-center text-gray-500 h-full">Selecione um cliente para iniciar o chat.</p>
                    ) : (
                        <>
                            {/* Header da Conversa */}
                            <div className="p-3 border-b border-white/10 bg-zinc-800 flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" onClick={() => setSelectedUserId(null)} className="md:hidden p-1 h-auto">
                                        <ArrowLeft size={16} />
                                    </Button>
                                    <p className="font-semibold text-white">{selectedClient?.first_name || selectedClient?.email}</p>
                                </div>
                                <span className="text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary">
                                    {selectedClient?.role}
                                </span>
                            </div>
                            
                            {/* Mensagens */}
                            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {currentConversation.map(msg => {
                                    const isMe = msg.sender_id === user.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-xl ${isMe ? 'bg-primary/80 text-white rounded-br-none' : 'bg-zinc-700 text-white rounded-tl-none'}`}>
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                <span className="text-[10px] mt-1 block text-right opacity-70">{formatTime(msg.created_at)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            
                            {/* Input de Mensagem */}
                            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-zinc-800 flex gap-2">
                                <input 
                                    type="text"
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    placeholder="Digite sua mensagem de suporte..."
                                    className="flex-grow bg-zinc-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                    disabled={!selectedUserId}
                                />
                                <Button type="submit" disabled={!selectedUserId || !messageContent.trim()} className="h-10 px-4 text-sm" icon={<Send size={16} />}>
                                    Enviar
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};