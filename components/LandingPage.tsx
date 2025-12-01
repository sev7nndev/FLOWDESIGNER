import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Code, Users, CheckCircle, Loader2, Edit3, Bot, Download } from 'lucide-react'; 
import { Button } from '../components/Button';
import { FeatureCard } from '../components/FeatureCard';
import { HowItWorksStep } from '../components/HowItWorksStep';
import { api } from '../services/api';
import { LandingImage } from '../types';

// Componente de Carrossel Simples
const ImageCarousel: React.FC<{ images: LandingImage[] }> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
            }, 5000); // Troca a cada 5 segundos
            return () => clearInterval(interval);
        }
    }, [images.length]);

    if (images.length === 0) {
        return (
            <div className="w-full h-96 bg-zinc-800 flex items-center justify-center rounded-xl">
                <p className="text-gray-500">Nenhuma imagem de destaque disponível.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-96 overflow-hidden rounded-xl shadow-2xl">
            {images.map((image, index) => (
                <img
                    key={image.id}
                    src={image.url}
                    alt={`Destaque ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                        index === currentIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            ))}
            
            {/* Indicadores de Navegação */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                            index === currentIndex ? 'bg-primary' : 'bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Ir para slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};


export const LandingPage: React.FC = () => {
    const [landingImages, setLandingImages] = useState<LandingImage[]>([]);
    const [isLoadingImages, setIsLoadingImages] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadImages = async () => {
            try {
                const images = await api.getLandingImages();
                setLandingImages(images);
            } catch (e: any) {
                console.error("Erro ao carregar imagens da landing page:", e);
                setError("Não foi possível carregar as imagens de destaque.");
            } finally {
                setIsLoadingImages(false);
            }
        };
        loadImages();
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-gray-100">
            {/* Header/Navbar (Placeholder) */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary">Flow Designer</h1>
                    <nav>
                        <Link to="/login">
                            <Button variant="primary" icon={<ArrowRight size={16} />} size="small">
                                Entrar
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="pt-20">
                {/* Seção 1: Hero */}
                <section className="py-20 md:py-32 bg-zinc-950">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
                            Crie Fluxos de Trabalho <span className="text-primary">Visuais</span> e Poderosos
                        </h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
                            Automatize tarefas complexas, integre serviços e visualize sua lógica de negócios com nossa interface de arrastar e soltar intuitiva.
                        </p>
                        <Link to="/register">
                            <Button size="large" icon={<Zap size={20} />}> 
                                Começar Gratuitamente
                            </Button>
                        </Link>
                        
                        {/* Carrossel de Imagens Dinâmico */}
                        <div className="mt-16">
                            {isLoadingImages ? (
                                <div className="w-full h-96 bg-zinc-900 flex items-center justify-center rounded-xl">
                                    <Loader2 size={32} className="animate-spin text-primary" />
                                </div>
                            ) : error ? (
                                <div className="w-full h-96 bg-red-900/20 border border-red-500/20 flex items-center justify-center rounded-xl text-red-400">
                                    {error}
                                </div>
                            ) : (
                                <ImageCarousel images={landingImages} />
                            )}
                        </div>
                    </div>
                </section>

                {/* Seção 2: Features */}
                <section className="py-20 bg-zinc-900/50 border-t border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h3 className="text-4xl font-bold text-center text-white mb-12">Por que Flow Designer?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard 
                                icon={<Code size={32} />}
                                title="Desenvolvimento Sem Código"
                                description="Crie lógica complexa sem escrever uma única linha de código. Foco na solução, não na sintaxe."
                                color="primary"
                            />
                            <FeatureCard 
                                icon={<Zap size={32} />}
                                title="Execução em Tempo Real"
                                description="Seus fluxos são executados instantaneamente, garantindo respostas rápidas e automação eficiente."
                                color="secondary"
                            />
                            <FeatureCard 
                                icon={<Users size={32} />}
                                title="Colaboração Simplificada"
                                description="Trabalhe em equipe nos mesmos fluxos, com controle de versão e histórico de alterações."
                                color="accent"
                            />
                        </div>
                    </div>
                </section>

                {/* Seção 3: How It Works */}
                <section className="py-20 md:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h3 className="text-4xl font-bold text-center text-white mb-16">Como Funciona</h3>
                        <div className="relative">
                            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-primary/20 hidden md:block"></div>
                            <div className="space-y-16">
                                <HowItWorksStep // FIX: Added missing props (Errors 2, 3, 4)
                                    stepNumber={1}
                                    number="01"
                                    title="Arraste e Conecte"
                                    description="Comece arrastando nós (nodes) para a tela e conecte-os para definir o fluxo de dados e lógica."
                                    isRight={false}
                                    icon={<Edit3 size={24} />} 
                                />
                                <HowItWorksStep // FIX: Added missing props (Errors 2, 3, 4)
                                    stepNumber={2}
                                    number="02"
                                    title="Configure a Lógica"
                                    description="Clique em cada nó para configurar suas propriedades, como URLs de API, condições de IF/ELSE ou transformações de dados."
                                    isRight={true}
                                    icon={<Bot size={24} />}
                                />
                                <HowItWorksStep // FIX: Added missing props (Errors 2, 3, 4)
                                    stepNumber={3}
                                    number="03"
                                    title="Publique e Monitore"
                                    description="Publique seu fluxo com um clique e monitore sua execução em tempo real através do painel de logs."
                                    isRight={false}
                                    icon={<Download size={24} />}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Seção 4: CTA Final */}
                <section className="py-16 bg-primary/10 border-t border-primary/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h3 className="text-4xl font-bold text-white mb-4">Pronto para Automatizar?</h3>
                        <p className="text-xl text-gray-300 mb-8">Junte-se a milhares de desenvolvedores e empresas que confiam no Flow Designer.</p>
                        <Link to="/register">
                            <Button size="large" icon={<CheckCircle size={20} />}> 
                                Criar Minha Conta Agora
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer (Placeholder) */}
            <footer className="bg-zinc-950 border-t border-white/10 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
                    &copy; {new Date().getFullYear()} Flow Designer. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
};