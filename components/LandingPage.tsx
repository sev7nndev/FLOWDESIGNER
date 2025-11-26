import React from 'react';
import { Button } from './Button';
import { LampHeader } from './Lamp';
import { ChevronRight, Sparkles, ShieldCheck, Zap, Check, Star, MessageSquare, Image as ImageIcon, CreditCard, ChevronDown, Phone, MapPin, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// --- COMPONENTE DE MOCKUP DE FLYER "PREMIUM" ---
const FlyerMockup = ({ bg, title, subtitle, phone, theme, badge, price }: any) => {
  
  // --- LAYOUT 1: MECÂNICA (Agressivo, Diagonal, Dark) ---
  if (theme === 'mechanic') {
    return (
      <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800">
        <img src={bg} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" alt={title} />
        {/* Overlay Diagonal */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-900/90 skew-y-6 transform origin-bottom-right translate-y-4 border-t-4 border-red-600" />
        
        {/* Content */}
        <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
          <div className="self-end">
            <div className="bg-red-600 text-white text-xs font-black italic uppercase px-3 py-1 skew-x-[-10deg] shadow-lg">
              {badge}
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-3xl font-black text-white italic uppercase leading-none drop-shadow-md tracking-tighter">
              {title}
            </h3>
            <div className="w-16 h-1.5 bg-red-600 my-2 skew-x-[-20deg]" />
            <p className="text-gray-300 text-[10px] font-bold uppercase tracking-wide mb-3">
              {subtitle}
            </p>
            <div className="flex items-center gap-2 bg-black/60 p-2 rounded-lg border border-white/10 backdrop-blur-sm w-fit">
              <Phone size={12} className="text-red-500" />
              <span className="text-white text-xs font-bold">{phone}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 2: GASTRONOMIA (Varejo, Preço em Destaque, Quente) ---
  if (theme === 'food') {
    return (
      <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800">
        <img src={bg} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" alt={title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        {/* Badge de Preço Circular */}
        <div className="absolute top-4 right-4 bg-yellow-500 w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.6)] rotate-12 group-hover:rotate-0 transition-transform border-2 border-white border-dashed">
          <span className="text-[8px] font-bold text-red-900 uppercase">Apenas</span>
          <span className="text-lg font-black text-red-900 leading-none">{price}</span>
        </div>

        <div className="absolute bottom-0 w-full p-5 text-center">
          <div className="bg-red-600/90 backdrop-blur-md p-4 rounded-t-2xl border-t border-yellow-500/50 shadow-lg">
            <h3 className="text-2xl font-black text-yellow-400 uppercase drop-shadow-md font-sans mb-1">
              {title}
            </h3>
            <p className="text-white text-[10px] font-medium leading-tight mb-2">
              {subtitle}
            </p>
            <div className="bg-white/10 rounded-full py-1 px-3 inline-block">
              <span className="text-white text-[10px] font-bold flex items-center gap-1 justify-center">
                <Phone size={8} /> {phone}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 3: JURÍDICO (Sóbrio, Elegante, Dourado) ---
  if (theme === 'law') {
    return (
      <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800 bg-slate-900">
        <div className="h-2/3 overflow-hidden relative">
           <img src={bg} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-700" alt={title} />
           <div className="absolute inset-0 bg-slate-900/30" />
        </div>
        
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center border-t border-amber-500/30">
          <div className="w-8 h-8 mb-3 text-amber-500 border border-amber-500/50 rounded flex items-center justify-center">
            <Shield size={16} />
          </div>
          <h3 className="text-lg font-serif font-bold text-white uppercase tracking-widest mb-1">
            {title}
          </h3>
          <div className="w-8 h-px bg-amber-500 my-2" />
          <p className="text-slate-400 text-[9px] uppercase tracking-wide mb-4 line-clamp-2">
            {subtitle}
          </p>
          <span className="text-amber-500 text-[10px] font-serif border border-amber-500/30 px-4 py-1 rounded-sm">
            {phone}
          </span>
        </div>
      </div>
    );
  }

  // --- LAYOUT 4: TECH / OFERTAS (Glassmorphism, Neon) ---
  return (
    <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800">
      <img src={bg} className="w-full h-full object-cover" alt={title} />
      <div className="absolute inset-0 bg-blue-900/30 mix-blend-overlay" />
      
      {/* Glass Card Center */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center w-full shadow-[0_8px_32px_rgba(0,0,0,0.37)] group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-cyan-500/30 blur-xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-purple-500/30 blur-xl rounded-full pointer-events-none" />
          
          <span className="bg-cyan-500 text-black text-[8px] font-bold uppercase px-2 py-0.5 rounded mb-3 inline-block">
            {badge}
          </span>
          <h3 className="text-xl font-bold text-white mb-2 leading-tight tracking-tight">
            {title}
          </h3>
          <p className="text-cyan-100 text-[9px] mb-3 leading-tight">
            {subtitle}
          </p>
          <div className="text-white font-mono text-[10px] bg-black/30 rounded py-1 border border-white/5">
            {phone}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  
  const flyers = [
    {
      bg: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1000&auto=format&fit=crop",
      title: "AUTO CENTER",
      subtitle: "REVISÃO • FREIOS • SUSPENSÃO",
      phone: "(11) 9998-2020",
      theme: "mechanic",
      badge: "PROMOÇÃO"
    },
    {
      bg: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop",
      title: "RITA SALGADOS",
      subtitle: "Cento de Salgados fritos na hora. Coxinha & Kibe.",
      phone: "(21) 9888-7777",
      theme: "food",
      badge: "Oferta",
      price: "R$49"
    },
    {
      bg: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop",
      title: "SILVA ADVOCACIA",
      subtitle: "Direito Trabalhista e Previdenciário.",
      phone: "(11) 3030-4040",
      theme: "law",
      badge: "Consultoria"
    },
    {
      bg: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto=format&fit=crop",
      title: "SMART AUDIO",
      subtitle: "Fone Bluetooth Pro com cancelamento de ruído.",
      phone: "www.site.com",
      theme: "tech",
      badge: "50% OFF"
    },
    {
      bg: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1000&auto=format&fit=crop",
      title: "BARBER SHOP",
      subtitle: "Corte e Barba. Cerveja gelada inclusa.",
      phone: "Agende Já",
      theme: "mechanic",
      badge: "ESTILO"
    },
    {
      bg: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
      title: "SUSHI HOUSE",
      subtitle: "Rodízio Premium com Sashimi Ilimitado.",
      phone: "(31) 3333-2222",
      theme: "food",
      badge: "Jantar",
      price: "R$89"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-x-hidden scroll-smooth">
      {/* Background Gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-zinc-950/0 to-zinc-950/0 pointer-events-none" />
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
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
            <button onClick={onGetStarted} className="hidden md:block text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-gray-200 transition-colors">
              Criar Conta
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-24 pb-12 md:pt-32 md:pb-20 relative overflow-hidden">
          <LampHeader />
          
          <div className="relative z-50 -mt-4 md:-mt-10 max-w-4xl mx-auto text-center px-6">
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Sua agência de design particular. Crie artes comerciais de nível de estúdio em segundos.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={onGetStarted} className="h-14 px-8 text-lg rounded-full shadow-[0_0_50px_-10px_rgba(139,92,246,0.6)] border border-white/20">
                Começar Agora <ChevronRight className="ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Marquee Gallery (Infinite Scroll) */}
        <section className="py-10 border-y border-white/5 bg-black/30 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
          
          <div className="flex w-[200%] animate-scroll hover:[animation-play-state:paused]">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-4 px-2">
                {flyers.map((flyer, idx) => (
                  <FlyerMockup key={idx} {...flyer} />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Poder da I.A.</span>
              <h3 className="text-3xl md:text-5xl font-bold text-white mt-2">Design Profissional Simplificado</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
              {/* Feature 1 - Large */}
              <div className="md:col-span-2 row-span-1 bg-zinc-900/50 backdrop-blur border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/30 transition-colors">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent" />
                <div className="relative z-10 max-w-sm">
                  <div className="bg-primary/20 w-fit p-3 rounded-xl mb-4 text-primary"><Zap size={24} /></div>
                  <h4 className="text-2xl font-bold text-white mb-2">Prompt Engineering Automático</h4>
                  <p className="text-gray-400">Você digita "Oficina Mecânica" e nossa I.A. escreve um comando de 500 palavras detalhando iluminação, texturas e ângulos para a melhor foto possível.</p>
                </div>
              </div>

              {/* Feature 2 - Small */}
              <div className="md:col-span-1 bg-zinc-900/50 backdrop-blur border border-white/10 rounded-3xl p-8 flex flex-col justify-center items-center text-center group hover:border-secondary/30 transition-colors">
                 <div className="bg-secondary/20 w-fit p-3 rounded-xl mb-4 text-secondary group-hover:scale-110 transition-transform"><ImageIcon size={24} /></div>
                 <h4 className="text-xl font-bold text-white mb-2">Imagens 8K</h4>
                 <p className="text-gray-400 text-sm">Resolução ultra-alta pronta para impressão ou web.</p>
              </div>

               {/* Feature 3 - Small */}
               <div className="md:col-span-1 bg-zinc-900/50 backdrop-blur border border-white/10 rounded-3xl p-8 flex flex-col justify-center items-center text-center group hover:border-green-400/30 transition-colors">
                 <div className="bg-green-400/20 w-fit p-3 rounded-xl mb-4 text-green-400 group-hover:scale-110 transition-transform"><ShieldCheck size={24} /></div>
                 <h4 className="text-xl font-bold text-white mb-2">Uso Comercial</h4>
                 <p className="text-gray-400 text-sm">Artes livres de direitos autorais para você vender.</p>
              </div>

              {/* Feature 4 - Large */}
              <div className="md:col-span-2 bg-zinc-900/50 backdrop-blur border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-accent/30 transition-colors">
                 <div className="absolute right-0 bottom-0 w-2/3 h-full bg-gradient-to-tl from-accent/10 to-transparent" />
                 <div className="relative z-10">
                   <div className="bg-accent/20 w-fit p-3 rounded-xl mb-4 text-accent"><CreditCard size={24} /></div>
                   <h4 className="text-2xl font-bold text-white mb-2">Custo Zero por Arte</h4>
                   <p className="text-gray-400">Diferente de designers que cobram por peça, aqui você tem geração ilimitada no plano Pro. Crie 10 variações e escolha a melhor.</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 relative overflow-hidden bg-zinc-900/30" id="precos">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

           <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Investimento</span>
              <h3 className="text-3xl md:text-4xl font-bold text-white mt-2">Planos Flexíveis</h3> {/* Reduced from 4xl to 3xl/4xl */}
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

// --- Sub-components ---

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  buttonText: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  onClick: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  name, price, period, description, buttonText, features, highlight, badge, onClick 
}) => {
  return (
    <div className={`relative rounded-3xl p-8 flex flex-col h-full transition-transform duration-300 hover:-translate-y-2 ${
      highlight 
        ? 'bg-zinc-900/80 border border-primary/50 shadow-2xl shadow-primary/20 z-10 scale-105' 
        : 'bg-zinc-900/40 border border-white/5 hover:border-white/10'
    }`}>
      {highlight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h4 className={`text-lg font-bold mb-2 ${highlight ? 'text-primary' : 'text-white'}`}>{name}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl md:text-4xl font-bold text-white">{price}</span> {/* Adjusted size here */}
          {period && <span className="text-gray-500 text-sm">{period}</span>}
        </div>
        <p className="text-gray-400 text-sm mt-2">{description}</p>
      </div>

      <div className="flex-grow space-y-4 mb-8">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 p-0.5 rounded-full ${highlight ? 'bg-primary/20 text-primary' : 'bg-white/10 text-gray-400'}`}>
              <Check size={12} />
            </div>
            <span className="text-gray-300 text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={onClick}
        className={`w-full h-12 rounded-xl text-sm font-bold ${
          highlight 
            ? 'bg-gradient-to-r from-primary to-secondary hover:brightness-110 shadow-lg shadow-primary/25' 
            : 'bg-white text-black hover:bg-gray-200 border-0'
        }`}
      >
        {buttonText}
      </Button>
    </div>
  );
};

const TestimonialCard = ({ name, role, text, stars, image }: any) => (
  <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
    <div className="flex gap-1 mb-4">
      {[...Array(stars)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
    </div>
    <p className="text-gray-300 text-sm italic mb-4">"{text}"</p>
    <div className="flex items-center gap-3">
      {/* User Photo */}
      <img src={image} alt={name} className="h-10 w-10 rounded-full object-cover border border-white/10" />
      <div>
        <h5 className="text-white text-sm font-bold">{name}</h5>
        <span className="text-gray-500 text-xs">{role}</span>
      </div>
    </div>
  </div>
);

const Accordion = ({ title, children }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="border-b border-white/5">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full py-4 flex items-center justify-between text-left text-white hover:text-primary transition-colors"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 pb-4' : 'max-h-0'}`}>
        <p className="text-gray-400 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
};