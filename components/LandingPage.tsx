import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { HoverBorderGradient } from './HoverBorderGradient'; // Importando o novo componente
import { ChevronRight, Sparkles, ShieldCheck, Zap, Image as ImageIcon, CreditCard, Loader2, Edit3, Bot, Download } from 'lucide-react';
import { TestimonialCard } from './TestimonialCard';
import { Accordion } from './Accordion';
import { FlyerMockupProps, FlyerMockup } from './FlyerMockup';
import { LandingImage } from '../types';
import { HeroSection } from './Hero';
import { PricingModal } from './PricingModal';
import { PricingCard } from './PricingCard';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  landingImages: LandingImage[];
  isLandingImagesLoading: boolean;
}

type FlyerData = Omit<FlyerMockupProps, 'theme'> & { theme: 'mechanic' | 'food' | 'law' | 'tech' };

const FALLBACK_FLYERS: FlyerData[] = [
    { bg: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1000&auto=format&fit=crop", title: "AUTO CENTER", subtitle: "REVISÃO • FREIOS • SUSPENSÃO", phone: "(11) 9998-2020", theme: "mechanic", badge: "PROMOÇÃO" },
    { bg: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto-format&fit=crop", title: "RITA SALGADOS", subtitle: "Cento de Salgados fritos na hora. Coxinha & Kibe.", phone: "(21) 9888-7777", theme: "food", badge: "Oferta", price: "R$49" },
    { bg: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto-format&fit=crop", title: "SILVA ADVOCACIA", subtitle: "Direito Trabalhista e Previdenciário.", phone: "(11) 3030-4040", theme: "law", badge: "Consultoria" },
    { bg: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto-format&fit=crop", title: "SMART AUDIO", subtitle: "Fone Bluetooth Pro com cancelamento de ruído.", phone: "www.site.com", theme: "tech", badge: "50% OFF" },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, landingImages, isLandingImagesLoading }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const scrollDirection = useScrollDirection();

  const carouselItems: FlyerData[] = landingImages.length > 0 ? landingImages.map((img: LandingImage) => ({
    bg: img.url, title: "Design IA", subtitle: "Gerado por Inteligência Artificial", phone: "Flow Designer",
    theme: (['mechanic', 'food', 'law', 'tech'] as const)[Math.floor(Math.random() * 4)], badge: "NOVO", price: undefined
  })) : FALLBACK_FLYERS;
  
  // Duplicamos o conteúdo 2x
  const marqueeContent = [...carouselItems, ...carouselItems];

  const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, color: 'primary' | 'secondary' | 'accent' }> = ({ icon, title, description, color }) => {
    const colorClasses = {
      primary: { bg: 'bg-primary/10', text: 'text-primary', hoverBorder: 'hover:border-primary/50', shadow: 'hover:shadow-primary/10', gradient: 'from-primary/5 to-transparent' },
      secondary: { bg: 'bg-secondary/10', text: 'text-secondary', hoverBorder: 'hover:border-secondary/50', shadow: 'hover:shadow-secondary/10', gradient: 'from-secondary/5 to-transparent' },
      accent: { bg: 'bg-accent/10', text: 'text-accent', hoverBorder: 'hover:border-accent/50', shadow: 'hover:shadow-accent/10', gradient: 'from-accent/5 to-transparent' }
    }[color];

    return (
      <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 bg-zinc-900/80 border border-white/10 shadow-xl transition-all duration-500 group ${colorClasses.hoverBorder} ${colorClasses.shadow}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <div className="relative z-10">
          <div className={`${colorClasses.bg} w-fit p-3 rounded-xl mb-4 ${colorClasses.text}`}>{icon}</div>
          <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
    );
  };

  const HowItWorksStep: React.FC<{ icon: React.ReactNode, number: string, title: string, description: string }> = ({ icon, number, title, description }) => (
    <div className="relative p-6 bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-white/20 hover:-translate-y-1">
      <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 hover:opacity-100" />
      <div className="relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            {icon}
          </div>
          <span className="text-5xl font-extrabold text-white/10">{number}</span>
        </div>
        <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-x-hidden scroll-smooth">
        {/* Animated Aurora Background */}
        <div className="absolute -top-1/4 -left-1/4 h-[800px] w-[800px] bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-full blur-3xl opacity-20 animate-pulse-slow" />
        {/* CORREÇÃO: Ajustando a posição do efeito de fundo inferior para usar bottom negativo em vez de translate-y-1/2 para evitar estender o scroll da página */}
        <div className="absolute bottom-[-300px] -right-1/4 h-[600px] w-[600px] bg-gradient-to-bl from-accent/30 to-primary/30 rounded-full blur-3xl opacity-20 animate-pulse-slow animation-delay-4000" />
        
        <motion.nav 
          variants={{
            visible: { y: 0, height: '4.5rem' },
            hidden: { y: 0, height: '4rem' }
          }}
          animate={scrollDirection === 'down' ? 'hidden' : 'visible'}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-lg"
        >
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
                 <Sparkles size={16} className="text-primary" />
              </div>
              <span className="text-white font-bold tracking-tight text-lg">FlowDesigner</span>
            </div>
            <div className="flex gap-4 items-center">
              <button onClick={onLogin} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Entrar
              </button>
              <Button onClick={() => setModalOpen(true)} className="hidden md:block text-sm font-medium px-5 py-2 rounded-full">
                Criar Conta
              </Button>
            </div>
          </div>
        </motion.nav>

        <main>
          <HeroSection onGetStarted={() => setModalOpen(true)} />

          <motion.section 
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={sectionVariants}
            className="py-10 border-y border-white/5 bg-black/30 overflow-hidden relative"
          >
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
            {isLandingImagesLoading ? (
              <div className="flex items-center justify-center h-40 text-gray-500">
                  <Loader2 size={24} className="animate-spin mr-2" /> Carregando galeria...
              </div>
            ) : (
              <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-4 p-4">
                {marqueeContent.map((item: FlyerData, idx: number) => <FlyerMockup key={idx} {...item} />)}
              </div>
            )}
          </motion.section>

          <motion.section 
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants}
            className="py-24 px-6 relative"
          >
            <div className="absolute inset-0 bg-grid-pattern bg-center opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)]" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-64 w-full bg-primary/10 blur-3xl animate-glow pointer-events-none" />
            <div className="max-w-6xl mx-auto relative">
              <div className="text-center mb-16">
                <span className="text-primary text-xs font-bold uppercase tracking-widest">Simples e Rápido</span>
                <h3 className="text-3xl md:text-5xl font-bold text-white mt-2">Sua Arte em 3 Passos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <HowItWorksStep icon={<Edit3 size={24} />} number="01" title="Descreva seu Negócio" description="Preencha um formulário simples com nome, contato e os detalhes do que você faz. A I.A. usa isso como briefing." />
                <HowItWorksStep icon={<Bot size={24} />} number="02" title="A I.A. Cria o Design" description="Nossa tecnologia analisa seu briefing e gera um design profissional, com textos, cores e imagens, em segundos." />
                <HowItWorksStep icon={<Download size={24} />} number="03" title="Baixe e Use" description="Receba sua arte em alta resolução, pronta para postar nas redes sociais, imprimir ou enviar para clientes." />
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants}
            className="py-24 px-6 bg-zinc-950/50 border-y border-white/5"
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="text-secondary text-xs font-bold uppercase tracking-widest">Recursos Poderosos</span>
                <h3 className="text-3xl md:text-5xl font-bold text-white mt-2">Tudo que Você Precisa para se Destacar</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[250px]">
                <FeatureCard icon={<Zap size={24} />} title="Prompt Engineering Automático" description="Você digita 'Oficina Mecânica' e nossa I.A. escreve um comando de 500 palavras detalhando iluminação, texturas e ângulos para a melhor foto possível." color="primary" />
                <FeatureCard icon={<ImageIcon size={24} />} title="Imagens 8K" description="Resolução ultra-alta pronta para impressão ou web." color="secondary" />
                <FeatureCard icon={<ShieldCheck size={24} />} title="Uso Comercial" description="Artes livres de direitos autorais para você vender." color="accent" />
                <FeatureCard icon={<CreditCard size={24} />} title="Custo Zero por Arte" description="Diferente de designers que cobram por peça, aqui você tem geração ilimitada no plano Pro." color="primary" />
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants}
            className="py-20 px-0 overflow-hidden bg-zinc-950 border-t border-white/5"
          >
            <div className="max-w-5xl mx-auto px-6 mb-12 text-center">
               <h3 className="text-3xl font-bold text-white">Quem usa, aprova</h3>
            </div>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
              <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-6 px-6">
                 {[...Array(2)].map((_: undefined, i: number) => ( // Duplicação 2x
                   <React.Fragment key={i}>
                      <div className="w-[300px] md:w-[400px] flex-shrink-0"><TestimonialCard name="Carlos Mendes" role="Dono de Oficina" text="Eu gastava 300 reais por semana com designer. Agora faço os posts da oficina em 5 minutos tomando café. A qualidade impressiona." stars={5} image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop" /></div>
                      <div className="w-[300px] md:w-[400px] flex-shrink-0"><TestimonialCard name="Dra. Julia Santos" role="Esteticista" text="Minha clínica precisava de uma identidade mais premium. O Flow Designer capturou exatamente o estilo 'clean' que eu queria. Recomendo!" stars={5} image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop" /></div>
                      <div className="w-[300px] md:w-[400px] flex-shrink-0"><TestimonialCard name="Mariana Costa" role="Lojista de Moda" text="As vendas da minha loja aumentaram muito depois que comecei a usar os templates de oferta. É muito rápido e profissional." stars={5} image="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" /></div>
                   </React.Fragment>
                 ))}
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants}
            className="py-24 px-6 bg-zinc-950/50 border-t border-white/5"
          >
              <div className="max-w-4xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-primary/20 shadow-2xl shadow-primary/10 relative overflow-hidden">
                  <div className="absolute -inset-20 bg-primary/10 blur-3xl rounded-full animate-pulse-slow -z-10" />
                  <Sparkles size={48} className="text-primary mx-auto mb-4" />
                  <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                      Pare de Pagar <span className="text-primary">Designers.</span>
                  </h3>
                  <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                      Comece a gerar artes de alta conversão em segundos com a inteligência artificial do Flow Designer.
                  </p>
                  {/* CORREÇÃO: Usando o componente Button para replicar o estilo da imagem */}
                  <Button 
                    onClick={() => setModalOpen(true)} 
                    className="h-14 px-10 text-lg font-semibold rounded-full"
                  >
                      Quero Minhas Artes Agora <ChevronRight className="ml-2" />
                  </Button>
              </div>
          </motion.section>

          <motion.section 
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants}
            className="py-20 px-6 bg-zinc-900/30"
          >
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-white">Perguntas Frequentes</h3>
              </div>
              <div className="space-y-4">
                <Accordion title="As imagens têm direitos autorais?">Sim, você pode usar todas as imagens geradas nos planos pagos para fins comerciais (Instagram, Facebook, Impressos) sem problemas.</Accordion>
                <Accordion title="Funciona no celular?">Perfeitamente. O Flow Designer foi criado pensando no mobile. Você cria a arte e baixa direto na galeria do seu telefone.</Accordion>
                <Accordion title="Posso cancelar quando quiser?">Sim, não há contrato de fidelidade. Você pode cancelar a assinatura a qualquer momento no seu painel.</Accordion>
              </div>
            </div>
          </motion.section>

          {/* FOOTER SIMPLIFICADO */}
          <footer className="border-t border-white/5 py-8 bg-zinc-950 text-center">
            <p className="text-gray-500 text-sm">© 2024 Flow Designer. Todos os direitos reservados.</p>
          </footer>
        </main>
      </div>
      <PricingModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onPlanSelect={onGetStarted} />
    </>
  );
};