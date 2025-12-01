import React from 'react';
import { User } from '../types';
import { LogOut, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    return (
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-primary" />
                    <span className="font-bold text-xl text-gray-900">FlowDesigner</span>
                </div>
                {user ? (
                    <Button onClick={onLogout} variant="ghost" className="text-sm text-gray-600 hover:text-red-500">
                        <LogOut size={16} className="mr-2" /> Sair
                    </Button>
                ) : (
                    <a href="/auth" className="text-sm font-medium text-primary hover:underline">Entrar</a>
                )}
            </div>
        </header>
    );
};

export default Header;