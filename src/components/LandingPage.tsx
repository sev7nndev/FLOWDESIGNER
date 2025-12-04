import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { ChevronRight, Sparkles, ShieldCheck, Zap, Image as ImageIcon, CreditCard, Loader2, ClipboardList, Palette, Download } from 'lucide-react';
import { PricingCard } from './PricingCard';
import { TestimonialCard } from './TestimonialCard';
import { Accordion } from './Accordion';
import { FlyerMockupProps, FlyerMockup } from './FlyerMockup';
import { LandingImage, EditablePlan } from '@/types';
import { HeroSection } from './Hero'; 
import { api } from '@/services/api';
import { FeatureCard } from './FeatureCard';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onSelectPlan: (planId: string) => void;
  onShowPlans: () => void;
  landingImages: LandingImage[];
  isLandingImagesLoading: boolean;
}

// Hardcoded fallback data (used if DB is empty or loading fails) - NOW OPTIMIZED
const FALLBACK_FLYERS: FlyerMockupProps[] = [
    {
      bg: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
      title: "Exemplo de Arte para Oficina Mecânica",
    },
    {
      bg: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop",
      title: "Exemplo de Arte para Hamburgueria",
    },
    {
      bg: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
      title: "Exemplo de Arte para Advocacia",
    },
    {
      bg: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop",
      title: "Exemplo de Arte para Loja de Eletrônicos",
    },
];

// Helper para formatar preço
const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;


export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onSelectPlan, onShowPlans, landingImages, isLandingImagesLoading }) => {
  const [plans, setPlans] = useState<EditablePlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setScrolled(currentScrollY > 10);

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const fetchPlans = async () => {
      try {
        const fetchedPlans = await api.getPlanSettings();
        setPlans(fetchedPlans.sort((a, b) => a.price - b.price));
      } catch (e) {
        console.error("Failed to fetch plans for landing page:", e);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    
  useEffect(() => {
    fetchPlans();
  }, []);
  
  const carouselItems: FlyerMockupProps[] = landingImages.length > 0 ? landingImages.map((img: LandingImage) => ({
    bg: img.url,
    title: "Arte Gerada por IA",
  })) : FALLBACK_FLYERS;
  
  const marqueeContent = [...carouselItems, ...carouselItems];
  
  const freePlan = plans.find(p => p.id === 'free');
  const starterPlan = plans.find(p => p.id === 'starter');
  const proPlan = plans.find(p => p.id === 'pro');

  const handleGetStarted = onGetStarted;

  const features = [
    { icon: <Zap size={24} />, title: "Prompt Engineering Automático", description: "Você descreve seu negócio e nossa I.A. cria um comando detalhado para gerar a melhor imagem possível, considerando iluminação, texturas e ângulos.", color: 'primary' as const },
    { icon: <ImageIcon size={24} />, title: "Imagens 4K", description: "Resolução de alta qualidade pronta para uso profissional na web ou em materiais impressos.", color: 'secondary' as const },
    { icon: <ShieldCheck size={24} />, title: "Uso Livre para seu Negócio", description: "Artes com direitos autorais livres para você usar na sua empresa, loja ou negócio.", color: 'accent' as const },
    { icon: <CreditCard size={24} />, title: "Custo Fixo por Mês", description: "Pague um valor fixo por mês e gere artes conforme os limites do seu plano, sem surpresas.", color: 'primary' as const }
  ];

  const howItWorksSteps = [
    {
      icon: <ClipboardList size={28} className="text-primary" />,
      title: "1. Preencha os Dados",
      description: "Informe o nome da sua empresa, contato e detalhes sobre o que você faz. Quanto mais detalhes, melhor o resultado."
    },
    {
      icon: <Palette size={28} className="text-secondary" />,
      title: "2. Escolha o Estilo",
      description: "Selecione um estilo visual como Moderno, Vintage ou Neon para dar a direção de arte que sua marca precisa."
    },
    {
      icon: <Sparkles size={28} className="text-accent" />,
      title: "3. Deixe a I.A. Criar",
      description: "Nossa inteligência artificial vai analisar suas informações e gerar uma arte única e profissional em segundos."
    },
    {
      icon: <Download size={28} className="text-green-500" />,
      title: "4. Baixe e Use",
      description: "Receba sua arte em alta resolução, pronta para ser usada no Instagram, Facebook ou onde mais você precisar."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-x-hidden">
      
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'border-b border-white/10 bg-zinc-950/80 backdrop-blur-lg shadow-xl shadow-black/30' : 'border-b border-transparent'} ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20"><Sparkles size={16} className="text-primary" /></div>
            <span className="text-white font-bold tracking-tight text-lg font-heading">FlowDesigner</span>
          </div>
          <div className="flex gap-4 items-center">
            <a href="#precos" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden md:block">Preços</a>
            <button onClick={onLogin} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Entrar</button>
            <Button onClick={onShowPlans} className="hidden md:block text-sm font-medium px-5 py-2 rounded-full">Criar Conta</Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        
        {/* Hero Section with Shader Background - Reduced Height */}
        <section className="relative w-full overflow-hidden h-[60vh] md:h-[70vh] flex items-center justify-center bg-zinc-950">
            {/* Hero Content (Relative positioning, z-index 10) */}
            <div className="relative z-10 h-full flex flex-col justify-center w-full">
                <HeroSection onGetStarted={handleGetStarted} />
            </div>
            
            {/* Gradient Overlay for Smooth Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent z-20 pointer-events-none" />
        </section>

        <section 
          className="py-10 bg-zinc-950 overflow-hidden relative" // Alterado: Removido border-y e bg-black/30, usando bg-zinc-950
        >
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
          
          {isLandingImagesLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-500"><Loader2 size={24} className="animate-spin mr-2" /> Carregando carrossel...</div>
          ) : (
            <div className="flex w-max gap-4 p-4 animate-scroll hover:[animation-play-state:paused]">
              {marqueeContent.map((item: FlyerMockupProps, idx: number) => (<FlyerMockup key={idx} bg={item.bg} title={item.title} />))}
            </div>
          )}
        </section>

        <section 
          className="py-24 px-6 relative"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Poder da I.A.</span>
              <h3 className="text-3xl md:text-5xl font-bold text-white mt-2 font-heading">Design Profissional Simplificado</h3>
            </div>
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {features.map((feature, index) => (
                <div key={index}>
                  <FeatureCard {...feature} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 px-6 bg-zinc-900/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-secondary text-xs font-bold uppercase tracking-widest">Processo</span>
              <h3 className="text-3xl md:text-5xl font-bold text-white mt-2 font-heading">Crie sua Arte em 4 Passos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorksSteps.map((step, index) => (
                <div key={index} className="text-center p-6 bg-zinc-950/50 rounded-2xl border border-white/10 transition-all hover:border-white/20 hover:-translate-y-1">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800 mb-6 mx-auto border border-white/10">
                    {step.icon}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section 
          className="py-24 px-6 relative overflow-hidden" 
          id="precos"
        >
           <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Investimento</span>
              <h3 className="text-3xl md:text-4xl font-bold text-white mt-2 font-heading">Planos Flexíveis</h3>
              <p className="text-gray-400 mt-4">Cancele a qualquer momento. Sem fidelidade.</p>
            </div>
            {isLoadingPlans ? (
                <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-end">
                    {freePlan && <PricingCard name={freePlan.display_name} price="R$ 0" period="" description={freePlan.description} buttonText="Criar Conta Grátis" features={[`${freePlan.max_images_per_month} imagens por mês`, ...freePlan.features.filter(f => !f.toLowerCase().includes('imagens'))]} onClick={() => onSelectPlan('free')} />}
                    {starterPlan && <PricingCard name={starterPlan.display_name} price={formatPrice(starterPlan.price)} period="/mês" description={starterPlan.description} buttonText="Assinar Start" features={starterPlan.features} highlight={false} onClick={() => onSelectPlan('starter')} />}
                    {proPlan && <PricingCard name={proPlan.display_name} price={formatPrice(proPlan.price)} period="/mês" description={proPlan.description} buttonText="Assinar Pro" features={proPlan.features} highlight={true} badge="Melhor Custo-Benefício" onClick={() => onSelectPlan('pro')} />}
                </div>
            )}
          </div>
        </section>

        <section 
          className="py-20 px-0 overflow-hidden bg-zinc-950 border-t border-white/5"
        >
          <div className="max-w-5xl mx-auto px-6 mb-12 text-center"><h3 className="text-3xl font-bold text-white font-heading">Quem usa aprova</h3></div>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
            <div className="flex w-max animate-scroll gap-6 px-6 hover:[animation-play-state:paused]">
               {[...Array(2)].map((_: undefined, i: number) => (
                 <React.Fragment key={i}>
                    <div className="w-[300px] md:w-[400px] flex-shrink-0"><TestimonialCard name="Carlos Mendes" role="Dono de Oficina" text="Eu gastava 300 reais por semana com designer. Agora faço os posts da oficina em 5 minutos tomando café. A qualidade impressiona." stars={5} image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop" /></div>
                    <div className="w-[300px] md:w-[400px] flex-shrink-0"><TestimonialCard name="Dra. Julia Santos" role="Esteticista" text="Minha clínica precisava de uma identidade mais premium. O Flow Designer capturou exatamente o estilo 'clean' que eu queria. Recomendo!" stars={5} image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop" /></div>
                    <div className="w-[300px] md:w-[400px] flex-shrink-0"><TestimonialCard name="Mariana Costa" role="Lojista de Moda" text="As vendas da minha loja aumentaram muito depois que comecei a usar os templates de oferta. É muito rápido e profissional." stars={5} image="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" /></div>
                 </React.Fragment>
               ))}
            </div>
          </div>
        </section>

        <section 
          className="py-24 px-6 bg-zinc-950/50 border-t border-white/5"
        >
            <div className="max-w-4xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-primary/20 shadow-2xl shadow-primary/10">
                <Sparkles size={48} className="text-primary mx-auto mb-4 animate-pulse-slow" />
                <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight font-heading">Pare de Pagar <span className="text-primary">Designers.</span></h3>
                <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">Comece a gerar artes de alta conversão em segundos com a inteligência artificial do Flow Designer.</p>
                <Button onClick={onShowPlans} className="h-14 px-10 text-lg rounded-full shadow-[0_0_50px_-10px_rgba(139,92,246,0.6)] border border-white/20">Quero Minhas Artes Agora <ChevronRight className="ml-2" /></Button>
            </div>
        </section>

        {/* NEW FAQ Section */}
        <section 
          className="py-20 px-6 bg-zinc-900/30 border-t border-white/5"
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12"><h3 className="text-3xl font-bold text-white font-heading">Perguntas Frequentes</h3></div>
            <div className="space-y-4">
              <Accordion title="As imagens têm direitos autorais?">Sim, você pode usar todas as imagens geradas nos planos pagos para fins comerciais (Instagram, Facebook, Impressos) sem problemas. No plano Grátis, a imagem contém uma marca d'água.</Accordion>
              <Accordion title="Funciona no celular?">Perfeitamente. O Flow Designer foi criado pensando no mobile. Você cria a arte e baixa direto na galeria do seu telefone.</Accordion>
              <Accordion title="Posso cancelar quando quiser?">Sim, não há contrato de fidelidade. Você pode cancelar a assinatura a qualquer momento no seu painel de usuário.</Accordion>
              <Accordion title="Como funciona o limite de imagens?">O limite é renovado mensalmente a partir da data de início do seu ciclo de faturamento. Se você atingir o limite, pode fazer upgrade ou esperar o próximo ciclo.</Accordion>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/5 py-12 bg-zinc-950 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="bg-white/10 p-1.5 rounded-lg"><Sparkles size={16} className="text-white" /></div>
            <span className="text-white font-bold font-heading">FlowDesigner</span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 Flow Designer. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  );
};