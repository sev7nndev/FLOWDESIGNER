import React from 'react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { Zap, Layout, Code } from 'lucide-react';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <header className="bg-zinc-900 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary">Flow Designer</h1>
                    <div className="space-x-3">
                        <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
                        <Button variant="primary" onClick={() => navigate('/register')}>Começar Grátis</Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-20 text-center">
                <Zap size={48} className="text-primary mx-auto mb-6" />
                <h2 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight">
                    Transforme Ideias em <span className="text-primary">Fluxos de Design</span>
                </h2>
                <p className="text-xl text-zinc-400 mb-10 max-w-3xl mx-auto">
                    Use IA para gerar fluxos de design de alta fidelidade instantaneamente a partir de uma simples descrição de negócio.
                </p>
                
                <div className="space-x-4">
                    <Button size="large" onClick={() => navigate('/register')} icon={<Layout size={20} />}>
                        Começar a Gerar (Grátis)
                    </Button>
                    <Button variant="secondary" size="large" onClick={() => navigate('/login')} icon={<Code size={20} />}>
                        Ver Demonstração
                    </Button>
                </div>

                {/* Placeholder for features/mockup */}
                <div className="mt-20 p-10 bg-zinc-900 rounded-xl border border-zinc-800">
                    <p className="text-zinc-500">Mockup da Interface do Aplicativo (Placeholder)</p>
                </div>
            </main>
        </div>
    );
};