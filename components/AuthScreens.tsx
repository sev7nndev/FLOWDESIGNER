import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Sparkles, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { GoogleIcon } from './GoogleIcon';
import { User } from '../types';
import { toast } from 'sonner';

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
  const [showPassword, setShowPassword] = useState(false);
  const [planId, setPlanId] = useState<string | undefined>(undefined);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    const status = urlParams.get('status');
    
    if (plan && status === 'success') {
      setPlanId(plan);
      setIsLogin(false); // Força a visão de cadastro se um plano foi pago
      toast.success(`Plano ${plan.toUpperCase()} pago!`, {
        description: 'Crie sua conta para ativar seu plano.',
        duration: 5000,
      });
    }
  }, []);

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email e senha são obrigatórios');
      return false;
    }

    if (!isLogin) {
      if (!formData.firstName.trim()) {
        setError('Primeiro nome é obrigatório');
        return false;
      }
      
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return false;
      }

      // Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Por favor, insira um email válido');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await authService.login(formData.email.trim(), formData.password);
        onSuccess(null);
      } else {
        await authService.register(
          formData.firstName.trim(), 
          formData.lastName.trim(), 
          formData.email.trim(), 
          formData.password, 
          planId
        );
        setSuccessMessage('Cadastro realizado! Verifique seu email para confirmar a conta.');
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ocorreu um erro desconhecido.');
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
      console.error('Google auth error:', err);
      setError(err.message || 'Erro ao fazer login com Google.');
      setIsGoogleLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Sucesso!</h2>
          <p className="text-gray-400 mt-4">{successMessage}</p>
          <div className="mt-6">
            <Button onClick={() => setIsLogin(true)} className="w-full">
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />
      
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in">
        <button onClick={onBack} className="absolute top-8 left-8 text-gray-500 hover:text-white transition-colors">
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
          
          {planId && !isLogin && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm text-white font-medium">
              Você está se cadastrando com o Plano <span className="uppercase font-bold">{planId}</span>.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Primeiro Nome</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors" 
                  placeholder="Seu nome" 
                  value={formData.firstName} 
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Sobrenome</label>
                <input 
                  type="text" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors" 
                  placeholder="Seu sobrenome" 
                  value={formData.lastName} 
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors" 
              placeholder="seu@email.com" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors pr-12" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Confirmar Senha</label>
              <input 
                type="password" 
                required 
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors" 
                placeholder="••••••••" 
                value={formData.confirmPassword} 
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

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
            type="button" 
            onClick={() => { 
              setIsLogin(!isLogin); 
              setError(''); 
              setSuccessMessage(''); 
              setFormData({ 
                firstName: '', 
                lastName: '', 
                email: '', 
                password: '', 
                confirmPassword: '' 
              }); 
            }} 
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? 'Não tem conta? Crie uma agora.' : 'Já tem conta? Faça login.'}
          </button>
        </div>
      </div>
    </div>
  );
};