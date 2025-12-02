import React, { useState } from 'react';
import { Button } from './Button';
import { Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { GoogleIcon } from './GoogleIcon';
import { User } from '../types';
import { getSupabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface AuthScreensProps {
  onSuccess: (user: User | null) => void;
  onBack: () => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ onSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await authService.login(formData.email, formData.password);
        // The auth state change will be handled by the parent component
        onSuccess(null);
      } else {
        if (!formData.firstName) {
          throw new Error("Primeiro nome é obrigatório");
        }
        
        await authService.register(formData.firstName, formData.lastName, formData.email, formData.password);
        setSuccessMessage('Cadastro realizado! Verifique seu e-mail para confirmar sua conta e poder fazer o login.');
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Ocorreu um erro desconhecido.';
      
      if (errorMessage.includes('you can only request this after')) {
        errorMessage = 'Muitas tentativas. Por favor, aguarde um minuto e tente novamente.';
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'Este e-mail já está cadastrado. Tente fazer login.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha inválidos.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await authService.loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
      setIsGoogleLoading(false);
    }
  };

  // Success screen
  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Quase lá!</h2>
          <p className="text-gray-400 mt-4">{successMessage}</p>
          <Button onClick={() => setIsLogin(true)} variant="secondary" className="w-full h-12 rounded-lg mt-8">
            Ir para o Login
          </Button>
        </div>
      </div>
    );
  }

  // Main auth screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />
      
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in">
        <button onClick={onBack} className="absolute top-8 left-8 text-gray-500 hover:text-white">
          <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white">{isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}</h2>
          <p className="text-gray-500 text-sm mt-2">
            {isLogin ? 'Entre para gerenciar suas artes.' : 'Comece a criar designs profissionais hoje.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Primeiro Nome</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none"
                  placeholder="Seu nome"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Sobrenome (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none"
                  placeholder="Seu sobrenome"
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Senha</label>
            <input 
              type="password" 
              required 
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <Button type="submit" isLoading={isLoading} className="w-full h-12 rounded-lg">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-zinc-900 px-2 text-gray-500">OU</span>
          </div>
        </div>

        <div>
          <Button 
            variant="secondary" 
            className="w-full h-12 rounded-lg"
            onClick={handleGoogleLogin}
            isLoading={isGoogleLoading}
            icon={<GoogleIcon className="h-5 w-5" />}
          >
            {isLogin ? 'Entrar com Google' : 'Cadastrar com Google'}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? 'Não tem conta? Crie uma agora.' : 'Já tem conta? Faça login.'}
          </button>
        </div>
      </div>
    </div>
  );
};