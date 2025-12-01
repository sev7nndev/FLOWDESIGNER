import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Send, Loader2, User as UserIcon, Zap, Star, Shield } from 'lucide-react'; // FIX: Removed unused MessageSquare import (Error 12)
import { Button } from './Button';
import { api } from '../services/api';

interface SupportChatProps {
    user: User;
    onClose: () => void; // Mantido para compatibilidade, mas não usado internamente
}

interface Message {
    id: number;
    sender: 'user' | 'support';
    content: string;
    timestamp: string;
}

// FIX: Removed unused getRoleIcon function (Error 13)

export const SupportChat: React.FC<SupportChatProps> = ({ user }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load initial messages (mocked)
    useEffect(() => {
        // Simula o carregamento de histórico
        setMessages([
            { id: 1, sender: 'support', content: `Olá ${user.firstName}! Bem-vindo ao suporte Flow Designer. Como podemos ajudar você hoje?`, timestamp: new Date().toLocaleTimeString() },
        ]);
    }, [user.firstName]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        const newMessage: Message = {
            id: Date.now(),
            sender: 'user',
            content: trimmedInput,
            timestamp: new Date().toLocaleTimeString(),
        };

        setMessages(prev => [...prev, newMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Simula o envio da mensagem para o backend e a resposta do suporte
            const response = await api.sendSupportMessage(user.id, trimmedInput); // FIX: api.sendSupportMessage now exists (Error 14)
            
            const supportResponse: Message = {
                id: Date.now() + 1,
                sender: 'support',
                content: response.reply,
                timestamp: new Date().toLocaleTimeString(),
            };
            
            setMessages(prev => [...prev, supportResponse]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorResponse: Message = {
                id: Date.now() + 1,
                sender: 'support',
                content: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.',
                timestamp: new Date().toLocaleTimeString(),
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950">
            {/* Área de Mensagens */}
            <div className="flex-grow p-4 space-y-4 overflow-y-auto custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl shadow-md ${
                            msg.sender === 'user' 
                                ? 'bg-primary text-black rounded-br-none' 
                                : 'bg-zinc-800 text-white rounded-tl-none'
                        }`}>
                            <p className="text-sm">{msg.content}</p>
                            <span className={`text-xs mt-1 block ${msg.sender === 'user' ? 'text-black/70' : 'text-gray-400'}`}>
                                {msg.timestamp}
                            </span>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] p-3 rounded-xl bg-zinc-800 text-white rounded-tl-none flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-primary" />
                            <span className="text-sm text-gray-400">Digitando...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Formulário de Entrada */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-zinc-900 flex gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-grow bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none text-sm"
                    disabled={isLoading}
                />
                <Button type="submit" isLoading={isLoading} disabled={!input.trim()} className="h-10 w-10 p-0 flex-shrink-0">
                    <Send size={18} />
                </Button>
            </form>
        </div>
    );
};