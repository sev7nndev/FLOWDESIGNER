import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AdminUser, ChatMessage, User } from '@/types';
import { DollarSign, Users, Trash2, MessageSquare, Send, Loader2, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAdminChat } from '@/hooks/useAdminChat';
import { toast } from 'sonner';

// --- Subcomponentes ---

// 1. Card de Métrica
const MetricCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number, color: string }> = ({ icon, title, value, color }) => (
    <div className={`p-6 rounded-xl border border-white/10 shadow-lg ${color}/10 bg-zinc-900/50`}>
        <div className={`p-3 w-fit rounded-full ${color}/20 ${color}`}>
            {icon}
        </div>
        <p className="text-sm text-gray-400 mt-4">{title}</p>
        <h4 className="text-2xl font-bold text-white mt-1">{value}</h4>
    </div>
);

// 2. Gerenciamento de Clientes
const UserManagement: React.FC<{ user: User }> = ({ user }) => {
    const { adminUsers, isLoadingAdminUsers, errorAdminUsers, deleteUser } = useAdminUsers(user.role, user.id);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    const handleDelete = useCallback(async (userId: string) => {
        setDeletingId(userId);
        await deleteUser(userId);
        setDeletingId(null);
    }, [deleteUser]);

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Users size={20} className="text-accent" /> Gestão de Clientes ({adminUsers.length})
            </h3>
            
            {isLoadingAdminUsers && <div className="text-center py-10"><Loader2 size={20} className="animate-spin text-accent" /></div>}
            {errorAdminUsers && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{errorAdminUsers}</div>}

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-white/10">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plano</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {adminUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{u.email}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{u.first_name} {u.last_name}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${u.role === 'owner' ? 'bg-purple-800' : u.role === 'admin' ? 'bg-red-600' : u.role === 'dev' ? 'bg-cyan-600' : u.role === 'pro' ? 'bg-primary' : 'bg-gray-500'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <Button 
                                        variant="danger" 
                                        onClick={() => handleDelete(u.id)}
                                        isLoading={deletingId === u.id}
                                        disabled={u.id === user.id}
                                        className="h-8 px-3 text-xs"
                                        icon={<Trash2 size={14} />}
                                    >
                                        {deletingId === u.id ? 'Deletando' : 'Excluir'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 3. Chat de Suporte
const AdminChat: React.FC<{ user: User, adminUsers: AdminUser[] }> = ({ user, adminUsers }) => {
    const { chatMessages, isLoadingChat, errorChat, sendMessage } = useAdminChat(user.role, user.id);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [messageContent, setMessageContent] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    
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
                                        <div key={msg.id} className="flex justify-end">
                                            <div className="max-w-[70%] p-3 rounded-xl bg-primary/80 text-white rounded-br-none">
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


// --- Componente Principal do Dashboard do Dono ---
export const OwnerDashboard: React.FC<{ user: User, adminUsers: AdminUser[] }> = ({ user, adminUsers }) => {
    const formatCurrency = (value: string) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));
    };

    return (
        <div className="space-y-12">
            <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-500" /> Dashboard de Métricas (Owner)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard 
                        icon={<DollarSign size={20} />} 
                        title="Faturamento Total (Mock)" 
                        value="R$ 0,00" 
                        color="text-green-500" 
                    />
                    <MetricCard 
                        icon={<Users size={20} />} 
                        title="Total de Usuários" 
                        value={adminUsers.length} 
                        color="text-primary" 
                    />
                    <MetricCard 
                        icon={<CheckCircle2 size={20} />} 
                        title="Assinaturas Ativas" 
                        value={0} 
                        color="text-cyan-500" 
                    />
                    <MetricCard 
                        icon={<AlertTriangle size={20} />} 
                        title="Assinaturas Inativas" 
                        value={0} 
                        color="text-yellow-500" 
                    />
                </div>
            </div>
            
            {/* Gerenciamento de Clientes */}
            <UserManagement user={user} />
            
            {/* Chat de Suporte */}
            <AdminChat user={user} adminUsers={adminUsers} />
        </div>
    );
};