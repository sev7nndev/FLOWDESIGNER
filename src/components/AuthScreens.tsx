import React, { useState } from 'react';
import { Button } from '../components/Button';
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/authService';
import { User, EditablePlan } from '@/types'; // Import User type and EditablePlan
import { FlowDesignerIcon } from './FlowDesignerLogo'; // Import the specific icon component
import { GoogleIcon } from './GoogleIcon'; // NEW: Import GoogleIcon

interface AuthScreensProps {
  onSuccess: (user: User | null) => void; 
  onBack: () => void;
  selectedPlanId: string | null; // Mantido, mas não usado para exibição
  plans: EditablePlan[]; // Mantido, mas não usado para exibição
  saasLogoUrl: string | null; 
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ onSuccess, onBack, saasLogoUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [rememberMe, setRememberMe] = useState(true); 
  
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
        // Pass rememberMe state to authService.login
        await authService.login(formData.email, formData.password);
        onSuccess(null); 
      } else {
        if (!formData.firstName) throw new Error("Primeiro nome é obrigatório");
        
        await authService.register(formData.firstName, formData.lastName, formData.email, formData.password);
        
        // Exibe a mensagem de sucesso em vez de tentar redirecionar
        setSuccessMessage('Cadastro realizado! Verifique seu e-mail para confirmar sua conta e poder fazer o login.');
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Ocorreu um erro desconhecido.';
      
      // Traduzindo erros comuns do Supabase
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
  
  // Removido: selectedPlan e isPaidPlan

  // --- TELA DE SUCESSO PÓS-CADASTRO ---
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

  // --- TELA DE LOGIN/CADASTRO PADRÃO ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />
      
      {/* Efeito de brilho centralizado */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 blur-[100px] opacity-30 pointer-events-none" />
      
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in">
        <button onClick={onBack} className="absolute top-8 left-8 p-2 text-gray-500 hover:text-white rounded-full hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </button>
        
        {/* Removido: Plan Intent Message */}

        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary mb-4 shadow-lg shadow-primary/20">
            {saasLogoUrl ? (
                <img src={saasLogoUrl} alt="SaaS Logo" className="h-10 w-10 object-contain" />
            ) : (
                <FlowDesignerIcon size={28} />
            )}
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">{isLogin ? 'Bem-vindo de volta' : 'Crie Sua Conta'}</h2>
          <p className="text-gray-400 text-sm mt-2">
            {isLogin ? 'Entre para gerenciar suas artes profissionais.' : 'Comece a criar designs de alta conversão hoje.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Primeiro Nome</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-colors"
                        placeholder="Seu nome"
                        value={formData.firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, firstName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Sobrenome (Opcional)</label>
                    <input 
                        type="text" 
                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-colors"
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
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-colors"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Senha</label>
            <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-colors pr-12"
                  placeholder="••••••••••"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
          </div>
          
          {isLogin && (
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-primary border-gray-600 rounded bg-black/50 focus:ring-primary"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                        Lembrar login
                    </label>
                </div>
                {/* Optional: Forgot Password link could go here */}
            </div>
          )}

          {error && <p className="text-red-400 text-xs text-center pt-2">{error}</p>}

          <Button 
            type="submit" 
            isLoading={isLoading} 
            className="w-full h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/30"
          >
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-zinc-900/80 px-2 text-gray-500">OU</span>
          </div>
        </div>

        <div>
          <Button 
            variant="secondary" 
            className="w-full h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 border-white/10"
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
            className="text-sm text-gray-400 hover:text-primary transition-colors font-medium"
          >
            {isLogin ? 'Não tem conta? Crie uma agora.' : 'Já tem conta? Faça login.'}
          </button>
        </div>
      </div>
    </div>
  );
};