import React from 'react';
import { Button } from './Button';
import { HeroSection } from './Hero';
import { ChevronRight, Sparkles, ShieldCheck, Zap, Image as ImageIcon, CreditCard, Loader2 } from 'lucide-react';
import { PricingCard } from './PricingCard';
import { TestimonialCard } from './TestimonialCard';
import { Accordion } from './Accordion';
import { FlyerMockupProps, FlyerMockup } from './FlyerMockup';
import { LandingImage } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  landingImages: LandingImage[];
  isLandingImagesLoading: boolean;
}

// Definindo o tipo localmente para garantir a compatibilidade
type FlyerData = Omit<FlyerMockupProps, 'theme'> & { theme: 'mechanic' | 'food' | 'law' | 'tech' };

// Hardcoded fallback data (used if DB is empty or loading fails)
const FALLBACK_FLYERS: FlyerData[] = [
    {
      bg: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1000&auto=format&fit=crop",
      title: "AUTO CENTER",
      subtitle: "REVISÃO • FREIOS • SUSPENSÃO",
      phone: "(11) 9998-2020",
      theme: "mechanic",
      badge: "PROMOÇÃO"
    },
    {
      bg: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto-format&fit=crop",
      title: "RITA SALGADOS",
      subtitle: "Cento de Salgados fritos na hora. Coxinha & Kibe.",
      phone: "(21) 9888-7777",
      theme: "food",
      badge: "Oferta",
      price: "R$49"
    },
    {
      bg: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto-format&fit=crop",
      title: "SILVA ADVOCACIA",
      subtitle: "Direito Trabalhista e Previdenciário.",
      phone: "(11) 3030-4040",
      theme: "law",
      badge: "Consultoria"
    },
    {
      bg: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto-format&fit=crop",
      title: "SMART AUDIO",
      subtitle: "Fone Bluetooth Pro com cancelamento de ruído.",
      phone: "www.site.com",
      theme: "tech",
      badge: "50% OFF"
    },
];


export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, landingImages, isLandingImagesLoading }) => {
  
  // Use dynamic images if available, otherwise use fallback
  const carouselItems: FlyerData[] = landingImages.length > 0 ? landingImages.map(img => ({
    bg: img.url,
    title: "Design IA",
    subtitle: "Gerado por Inteligência Artificial",
    phone: "Flow Designer",
    theme: (['mechanic', 'food', 'law', 'tech'] as const)[Math.floor(Math.random() * 4)], // Random theme for mockup style
    badge: "NOVO",
    price: undefined // Explicitly set price as undefined to match FlyerData type
  })) : FALLBACK_FLYERS;
  
  // Duplicate items for infinite scroll effect
  const marqueeContent = [...carouselItems, ...carouselItems];

  // Componente de Card de Recurso Reutilizável
  const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, color: 'primary' | 'secondary' | 'accent' }> = ({ icon, title, description, color }) => {
    const colorClasses = {
      primary: {
        bg: 'bg-primary/10',
        text: 'text-primary',
        hoverBorder: 'hover:border-primary/50',
        shadow: 'hover:shadow-primary/10',
        gradient: 'from-primary/5 to-transparent'
      },
      secondary: {
        bg: 'bg-secondary/10',
        text: 'text-secondary',
        hoverBorder: 'hover:border-secondary/50',
        shadow: 'hover:shadow-secondary/10',
        gradient: 'from-secondary/5 to-transparent'
      },
      accent: {
        bg: 'bg-accent/10',
        text: 'text-accent',
        hoverBorder: 'hover:border-accent/50',
        shadow: 'hover:shadow-accent/10',
        gradient: 'from-accent/5 to-transparent'
      }
    }[color];

    return (
      <div 
        className={`relative overflow-hidden rounded-3xl p-6 md:p-8 bg-zinc-900/80 border border-white/10 shadow-xl transition-all duration-500 group ${colorClasses.hoverBorder} ${colorClasses.shadow}`}
      >
        {/* Efeito de Borda Mágica/Gradiente */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        
        <div className="relative z-10">
          <div className={`${colorClasses.bg} w-fit p-3 rounded-xl mb-4 ${colorClasses.text}`}>
            {icon}
          </div>
          <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-x-hidden scroll-smooth">
      {/* Background Gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/95">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
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
            <Button onClick={onGetStarted} className="hidden md:block text-sm font-medium px-5 py-2 rounded-full">
              Criar Conta
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection onGetStarted={onGetStarted} />

        {/* Marquee Gallery (Infinite Scroll) */}
        <section className="py-10 border-y border-white/5 bg-black/30 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
          
          {isLandingImagesLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
                <Loader2 size={24} className="animate-spin mr-2" /> Carregando carrossel...
            </div>
          ) : (
            <div className="flex w-max animate-scroll hover:[animation-play-state:paused] gap-4 p-4">
              {marqueeContent.map((item, idx) => (
                <FlyerMockup 
                  key={idx} 
                  bg={item.bg} 
                  title={item.title} 
                  subtitle={item.subtitle} 
                  phone={item.phone} 
                  theme={item.theme} 
                  badge={item.badge} 
                  price={item.price} 
                />
              ))}
            </div>
          )}
        </section>

        {/* Bento Grid Features */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Poder da I.A.</span>
              <h3 className="text-3xl md:text-5xl font-bold text-white mt-2">Design Profissional Simplificado</h3>
            </div>

            {/* Mantendo grid-cols-1 para empilhar, mas aumentando a altura para parecer mais quadrado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[250px]">
              
              <FeatureCard
                icon={<Zap size={24} />}
                title="Prompt Engineering Automático"
                description="Você digita 'Oficina Mecânica' e nossa I.A. escreve um comando de 500 palavras detalhando iluminação, texturas e ângulos para a melhor foto possível."
                color="primary"
              />

              <FeatureCard
                icon={<ImageIcon size={24} />}
                title="Imagens 8K"
                description="Resolução ultra-alta pronta para impressão ou web."
                color="secondary"
              />

              <FeatureCard
                icon={<ShieldCheck size={24} />}
                title="Uso Comercial"
                description="Artes livres de direitos autorais para você vender."
                color="accent"
              />

              <FeatureCard
                icon={<CreditCard size={24} />}
                title="Custo Zero por Arte"
                description="Diferente de designers que cobram por peça, aqui você tem geração ilimitada no plano Pro."
                color="primary"
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 relative overflow-hidden bg-zinc-900/30" id="precos">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

           <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Investimento</span>
              <h3 className="text-3xl md:text-4xl font-bold text-white mt-2">Planos Flexíveis</h3>
              <p className="text-gray-400 mt-4">Cancele a qualquer momento. Sem fidelidade.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-end">
              
              <PricingCard 
                name="Free"
                price="R$ 0"
                period=""
                description="Para testar a tecnologia."
                buttonText="Criar Conta Grátis"
                features={["3 Gerações Gratuitas", "Qualidade Padrão", "Marca d'água", "Suporte Comunitário"]}
                onClick={onGetStarted}
              />

              <PricingCard 
                name="Start"
                price="R$ 29,99"
                period="/mês"
                description="Ideal para autônomos."
                buttonText="Assinar Start"
                features={["20 Imagens Profissionais", "Qualidade 4K", "Sem marca d'água", "Uso Comercial Liberado", "Suporte por Email"]}
                highlight={false}
                onClick={onGetStarted}
              />

              <PricingCard 
                name="Pro"
                price="R$ 49,99"
                period="/mês"
                description="Para agências e power users."
                buttonText="Assinar Pro"
                features={["50 Imagens Profissionais", "Qualidade Ultra 8K", "Geração Instantânea (Turbo)", "Sem marca d'água", "Acesso ao Painel Dev", "Prioridade no Suporte"]}
                highlight={true}
                badge="Melhor Custo-Benefício"
                onClick={onGetStarted}
              />
            </div>
          </div>
        </section>

        {/* Testimonials (Marquee) */}
        <section className="py-20 px-0 overflow-hidden bg-zinc-950 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6 mb-12 text-center">
             <h3 className="text-3xl font-bold text-white">Quem usa aprova</h3>
          </div>
          
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
            
            <div className="flex w-max animate-scroll gap-6 px-6 hover:[animation-play-state:paused]">
               {/* Duplicating for infinite scroll effect */}
               {[...Array(2)].map((_, i) => (
                 <React.Fragment key={i}>
                    <div className="w-[300px] md:w-[400px] flex-shrink-0">
                      <TestimonialCard 
                        name="Carlos Mendes" 
                        role="Dono de Oficina" 
                        text="Eu gastava 300 reais por semana com designer. Agora faço os posts da oficina em 5 minutos tomando café. A qualidade impressiona." 
                        stars={5}
                        image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop"
                      />
                    </div>
                    <div className="w-[300px] md:w-[400px] flex-shrink-0">
                      <TestimonialCard 
                        name="Dra. Julia Santos" 
                        role="Esteticista" 
                        text="Minha clínica precisava de uma identidade mais premium. O Flow Designer capturou exatamente o estilo 'clean' que eu queria. Recomendo!" 
                        stars={5}
                        image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop"
                      />
                    </div>
                    <div className="w-[300px] md:w-[400px] flex-shrink-0">
                      <TestimonialCard 
                        name="Mariana Costa" 
                        role="Lojista de Moda" 
                        text="As vendas da minha loja aumentaram muito depois que comecei a usar os templates de oferta. É muito rápido e profissional." 
                        stars={5}
                        image="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"
                      />
                    </div>
                 </React.Fragment>
               ))}
            </div>
          </div>
        </section>

        {/* CTA Section (NEW) */}
        <section className="py-24 px-6 bg-zinc-950/50 border-t border-white/5">
            <div className="max-w-4xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-primary/20 shadow-2xl shadow-primary/10">
                <Sparkles size={48} className="text-primary mx-auto mb-4 animate-pulse-slow" />
                <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                    Pare de Pagar <span className="text-primary">Designers.</span>
                </h3>
                <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                    Comece a gerar artes de alta conversão em segundos com a inteligência artificial do Flow Designer.
                </p>
                <Button onClick={onGetStarted} className="h-14 px-10 text-lg rounded-full shadow-[0_0_50px_-10px_rgba(139,92,246,0.6)] border border-white/20">
                    Quero Minhas Artes Agora <ChevronRight className="ml-2" />
                </Button>
            </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-6 bg-zinc-900/30">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-white">Perguntas Frequentes</h3>
            </div>
            <div className="space-y-4">
              <Accordion title="As imagens têm direitos autorais?">
                Sim, você pode usar todas as imagens geradas nos planos pagos para fins comerciais (Instagram, Facebook, Impressos) sem problemas.
              </Accordion>
              <Accordion title="Funciona no celular?">
                Perfeitamente. O Flow Designer foi criado pensando no mobile. Você cria a arte e baixa direto na galeria do seu telefone.
              </Accordion>
              <Accordion title="Posso cancelar quando quiser?">
                Sim, não há contrato de fidelidade. Você pode cancelar a assinatura a qualquer momento no seu painel.
              </Accordion>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 bg-zinc-950 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="bg-white/10 p-1.5 rounded-lg">
               <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-white font-bold">FlowDesigner</span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 Flow Designer. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  );
};