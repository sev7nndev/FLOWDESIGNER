// frontend/src/components/Auth.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const action = isLogin ? signIn : signUp;
        const { error } = await action(email, password);

        if (error) {
            setMessage(error.message);
        } else if (!isLogin) {
            setMessage('Cadastro realizado! Verifique seu email para confirmar.');
        }
        
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
                    {isLogin ? 'Entrar' : 'Criar Conta'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>

                {message && (
                    <p className={`mt-4 text-center ${message.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}

                <p className="mt-6 text-center text-sm text-gray-600">
                    {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="ml-1 font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        {isLogin ? 'Cadastre-se' : 'Faça login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;