import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User } from '../types';
import { useOwnerChat, ChatThread } from '../hooks/useOwnerChat';
import { Loader2, MessageSquare, Send, User as UserIcon } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface OwnerChatPanelProps {
  owner: User;
  clients: any[]; // Lista de clientes do OwnerPanelPage
}

// --- Componente de Item da Lista de Chats ---
interface ChatListItemProps {
  thread: ChatThread;
  isActive: boolean;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ thread, isActive, onClick }) => {
  const lastMessageTime = useMemo(() => {
    const date = new Date(thread.lastMessage.timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [thread.lastMessage.timestamp]);

  return (
    <div 
      className={`flex items-center p-4 cursor-pointer transition-colors border-b border-white/5 ${
        isActive 
          ? 'bg-primary/20 border-l-4 border-primary' 
          : 'hover:bg-white/5'
      }`} 
      onClick={onClick}
    >
      <div className="relative mr-4">
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white">
          <UserIcon size={20} />
        </div>
        {thread.unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-zinc-900 bg-red-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{thread.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {thread.lastMessage.sender === 'owner' ? 'Você: ' : ''}
          {thread.lastMessage.text}
        </p>
      </div>
      <div className="text-xs text-gray-500 ml-2 flex flex-col items-end">
        <span>{lastMessageTime}</span>
        {thread.unreadCount > 0 && (
          <span className="mt-1 px-2 py-0.5 text-xs font-bold text-white bg-primary rounded-full">
            {thread.unreadCount}
          </span>
        )}
      </div>
    </div>
  );
};

// --- Componente de Janela de Chat Ativa ---
interface ActiveChatWindowProps {
  thread: ChatThread;
  sendMessage: (recipientId: string, content: string) => Promise<void>;
}

const ActiveChatWindow: React.FC<ActiveChatWindowProps> = ({ thread, sendMessage }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(scrollToBottom, [thread.messages]);

  // Função real para envio de mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '' || isSending) return;
    
    setIsSending(true);
    const content = message.trim();
    setMessage(''); // Limpa o input imediatamente
    
    try {
      await sendMessage(thread.id, content);
    } catch (e) {
      // O toast já é exibido no hook, mas podemos reverter o input se necessário
      setMessage(content); 
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-white/10">
      {/* Header do Chat */}
      <div className="p-4 border-b border-white/10 flex items-center">
        <h3 className="text-lg font-bold text-white">{thread.name}</h3>
      </div>
      
      {/* Área de Mensagens */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {thread.messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'owner' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
              msg.sender === 'owner' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-zinc-700 text-white rounded-tl-none'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <span className="block text-right text-[10px] mt-1 opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input de Mensagem */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-3">
        <Input
          type="text"
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-zinc-800 border-zinc-700 text-white"
          disabled={isSending}
        />
        <Button type="submit" icon={<Send size={16} />} isLoading={isSending} disabled={!message.trim() || isSending}>
          Enviar
        </Button>
      </form>
    </div>
  );
};

// --- Componente Principal OwnerChatPanel ---
export const OwnerChatPanel: React.FC<OwnerChatPanelProps> = ({ owner }) => {
  const { chatHistory, isLoading, error, refreshHistory, sendMessage } = useOwnerChat();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  
  const activeThread = useMemo(() => {
    return chatHistory.find(thread => thread.id === activeThreadId);
  }, [chatHistory, activeThreadId]);

  // Define o primeiro chat como ativo ao carregar
  React.useEffect(() => {
    if (!activeThreadId && chatHistory.length > 0) {
      setActiveThreadId(chatHistory[0].id);
    }
  }, [chatHistory, activeThreadId]);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <Loader2 size={32} className="animate-spin text-primary mx-auto" />
        <p className="text-gray-400 mt-4">Carregando histórico de chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
        Erro ao carregar o chat: {error}
        <Button onClick={refreshHistory} variant="secondary" className="ml-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (chatHistory.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <MessageSquare size={48} className="mx-auto mb-4" />
        <p>Nenhum histórico de chat encontrado com clientes.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[70vh] min-h-[600px] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
      {/* Painel Lateral de Clientes */}
      <div className={`w-full md:w-80 flex-shrink-0 bg-zinc-900/50 ${activeThreadId && 'hidden md:block'}`}>
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            Clientes ({chatHistory.length})
          </h3>
        </div>
        <div className="overflow-y-auto h-[calc(100%-65px)] custom-scrollbar">
          {chatHistory.map((thread) => (
            <ChatListItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              onClick={() => setActiveThreadId(thread.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Janela de Chat Ativa */}
      <div className={`flex-1 ${activeThreadId ? 'block' : 'hidden md:block'}`}>
        {activeThread ? (
          <ActiveChatWindow 
            thread={activeThread} 
            sendMessage={sendMessage} // Passando a função de envio
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-zinc-900/70 text-gray-500">
            Selecione um cliente para começar a conversar.
          </div>
        )}
      </div>
    </div>
  );
};