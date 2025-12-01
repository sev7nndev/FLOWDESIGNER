import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface AuthScreensProps {
    isLogin: boolean;
    onSuccess: (user: User | null) => void;
    onBack: () => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ isLogin, onSuccess, onBack }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    const title = isLogin ? 'Acesse sua conta' : 'Crie sua conta';
    const buttonText = isLogin ? 'Entrar' : 'Registrar';
    const switchText = isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?';
    const switchLinkText = isLogin ? 'Registre-se' : 'Faça Login';
    const switchPath = isLogin ? '/register' : '/login';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                await authService.login(email, password);
                // Supabase onAuthStateChange handles the session update, onSuccess is called by the page component
                onSuccess(null); 
            } else {
                await authService.register(firstName, lastName, email, password);
                setIsRegistered(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLogin && isRegistered) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
                <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-2xl border border-white/10 text-center">
                    <h2 className="text-3xl font-bold text-primary mb-4">Sucesso!</h2>
                    <p className="text-gray-300 mb-6">
                        Quase lá! Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada (e spam) para ativar sua conta.
                    </p>
                    <Button onClick={() => window.location.href = '/login'} variant="primary">
                        Ir para Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-2xl border border-white/10">
                <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors flex items-center mb-6">
                    <ArrowLeft size={18} className="mr-2" />
                    Voltar
                </button>

                <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="flex space-x-4">
                            <Input
                                type="text"
                                placeholder="Primeiro Nome"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                            <Input
                                type="text"
                                placeholder="Sobrenome"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <Input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded">{error}</p>
                    )}

                    <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : buttonText}
                    </Button>
                </form>

                <div className="mt-6 text-center text-gray-400">
                    {switchText}{' '}
                    <a href={switchPath} className="text-primary hover:text-secondary font-semibold transition-colors">
                        {switchLinkText}
                    </a>
                </div>
            </div>
        </div>
    );
};