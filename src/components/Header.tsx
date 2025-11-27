import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';

export const Header: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const getInitials = (email: string) => {
        if (!email) return '?';
        return email.charAt(0).toUpperCase();
    };

    return (
        <header className="bg-zinc-950/50 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Flow Art" className="h-8" />
                    <span className="font-bold text-xl text-white tracking-tighter">FlowArt</span>
                </div>
                <div className="relative">
                    {user ? (
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="h-10 w-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center border border-primary/30">
                            {getInitials(user.email || '')}
                        </button>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
                    )}

                    {isMenuOpen && user && (
                        <div 
                            className="absolute top-12 right-0 w-64 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl p-2 origin-top-right animate-fade-in-down"
                            onMouseLeave={() => setIsMenuOpen(false)}
                        >
                            <div className="px-3 py-2 border-b border-white/5">
                                <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                                <p className="text-xs text-gray-400">Plano Free</p>
                            </div>
                            <div className="p-1 mt-1">
                                <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors">
                                    <LogOut size={16} />
                                    Sair da Conta
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};