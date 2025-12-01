import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { HoverBorderGradient } from './HoverBorderGradient';
import { ChevronRight, Sparkles, ShieldCheck, Zap, Image as ImageIcon, CreditCard, Loader2, Edit3, Bot, Download } from 'lucide-react';
import { TestimonialCard } from './TestimonialCard';
import { Accordion } from './Accordion';
import { FlyerMockupProps, FlyerMockup } from './FlyerMockup';
import { LandingImage } from '../types';
import { HeroSection } from './Hero';
import { PricingModal } from './PricingModal';
import { PricingCard } from './PricingCard';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { BeamsBackground } from './BeamsBackground';
import { cn } from "@/lib/utils";

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const SoftDivider = ({ className }: { className?: string }) => (
  <div className={cn("w-full h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent my-16", className)} />
);

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <motion.div
    className="flex flex-col items-start p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl hover:border-indigo-500/50 transition-all duration-300"
    variants={sectionVariants}
    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
  >
    <div className="p-3 mb-4 bg-indigo-600/20 rounded-full text-indigo-400">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  landingImages,
  isLandingImagesLoading,
}) => {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const scrollDirection = useScrollDirection();

  const testimonials = [
    { name: "Ana Paula", title: "Dona de Loja", quote: "O FLOW transformou a maneira como crio flyers. É rápido, profissional e o resultado é incrível!", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Marcos Vinícius", title: "Advogado", quote: "Criei um flyer elegante para meu escritório em minutos. A IA realmente entende o que eu preciso.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Juliana Lima", title: "Chef de Cozinha", quote: "As promoções de hoje saem na hora! A qualidade das imagens geradas é surpreendente.", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
  ];

  const faqs = [
    { question: "O que é o FLOW?", answer: "FLOW é uma ferramenta de criação de flyers e artes para redes sociais baseada em Inteligência Artificial. Você descreve o que precisa, e a IA gera o design completo em segundos." },
    { question: "Preciso ter conhecimento em design?", answer: "Não! O FLOW foi feito para ser usado por qualquer pessoa. A IA cuida de todo o layout, cores e tipografia, garantindo um resultado profissional." },
    { question: "Posso editar o flyer depois de gerado?", answer: "Sim. Após a geração inicial, você pode fazer ajustes finos no texto, cores e elementos antes de baixar o arquivo final." },
    { question: "Quais são os planos de preço?", answer: "Oferecemos um plano gratuito com recursos básicos e planos pagos (Pro e Premium) que liberam gerações ilimitadas, recursos avançados de IA e downloads em alta resolução." },
  ];

  const features = [
    { icon: <Sparkles className="w-6 h-6" />, title: "Geração por IA", description: "Descreva sua ideia e veja a IA criar um design profissional em segundos." },
    { icon: <ShieldCheck className="w-6 h-6" />, title: "Designs Otimizados", description: "Flyers prontos para impressão ou para postagens em redes sociais (Instagram, Facebook, WhatsApp)." },
    { icon: <Zap className="w-6 h-6" />, title: "Velocidade Incomparável", description: "Crie 10 designs no tempo que levaria para abrir um software de edição tradicional." },
    { icon: <ImageIcon className="w-6 h-6" />, title: "Banco de Imagens", description: "Acesso a milhões de imagens de alta qualidade e geração de imagens exclusivas por IA." },
    { icon: <CreditCard className="w-6 h-6" />, title: "Preços Acessíveis", description: "Planos flexíveis que se encaixam no seu orçamento, incluindo uma opção gratuita." },
    { icon: <Edit3 className="w-6 h-6" />, title: "Edição Simples", description: "Ajuste textos, cores e posições com uma interface de arrastar e soltar intuitiva." },
  ];

  const pricingPlans = [
    {
      name: "Grátis",
      price: "R$0",
      frequency: "/mês",
      description: "Ideal para quem está começando e quer testar a ferramenta.",
      features: [
        "5 Gerações por mês",
        "Acesso a templates básicos",
        "Download em resolução padrão",
        "Suporte por e-mail",
      ],
      buttonText: "Começar Grátis",
      isPrimary: false,
    },
    {
      name: "Pro",
      price: "R$49",
      frequency: "/mês",
      description: "Para profissionais e pequenos negócios que precisam de volume.",
      features: [
        "Gerações Ilimitadas",
        "Acesso a todos os templates premium",
        "Download em Alta Resolução (4K)",
        "Remoção de marca d'água",
        "Suporte prioritário",
      ],
      buttonText: "Assinar Agora",
      isPrimary: true,
    },
    {
      name: "Premium",
      price: "R$99",
      frequency: "/mês",
      description: "Para agências e grandes volumes de criação.",
      features: [
        "Tudo do Plano Pro",
        "Geração de Imagens por IA (DALL-E)",
        "Colaboração em equipe (3 usuários)",
        "Integração com Google Drive/Dropbox",
        "Consultoria de design (1h/mês)",
      ],
      buttonText: "Falar com Vendas",
      isPrimary: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <BeamsBackground />

      {/* Header Fixo */}
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md bg-gray-950/80 border-b border-white/10",
          scrollDirection === "down" && "translate-y-[-100%]",
          scrollDirection === "up" && "translate-y-0"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="text-2xl font-bold text-indigo-400 flex items-center">
            <Bot className="w-6 h-6 mr-2" />
            FLOW
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            {['Recursos', 'Exemplos', 'Preços', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-300 hover:text-indigo-400 transition duration-150"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onLogin} className="text-sm">
              Entrar
            </Button>
            <Button onClick={onGetStarted} className="text-sm">
              Começar Grátis
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="pt-16 relative z-10">
        {/* 1. Hero Section */}
        <HeroSection onGetStarted={onGetStarted} />

        <SoftDivider />

        {/* 2. Features Section */}
        <section id="recursos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-400 bg-indigo-400/10 rounded-full mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              O Poder da IA
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Crie Designs Profissionais em Segundos
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              O FLOW utiliza inteligência artificial avançada para transformar sua ideia em um flyer pronto para uso, sem complicação.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.1 }}
                variants={sectionVariants}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </section>

        <SoftDivider />

        {/* 3. Mockup/Examples Section */}
        <section id="exemplos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Veja a Mágica Acontecer
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Flyers gerados pela nossa IA para diversos nichos de mercado.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FALLBACK_FLYERS.map((flyer, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.1 }}
                variants={sectionVariants}
              >
                <FlyerMockup {...flyer} />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <HoverBorderGradient
              containerClassName="rounded-full inline-block"
              as="button"
              className="bg-gray-950 text-white flex items-center px-8 py-3 text-lg font-semibold"
              onClick={onGetStarted}
            >
              Crie o Seu Primeiro Flyer Grátis
              <ChevronRight className="w-5 h-5 ml-2" />
            </HoverBorderGradient>
          </motion.div>
        </section>

        <SoftDivider />

        {/* 4. Pricing Section */}
        <section id="preços" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Planos Simples e Transparentes
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Escolha o plano que melhor se adapta ao volume de criação do seu negócio.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.1 }}
                variants={sectionVariants}
              >
                <PricingCard
                  {...plan}
                  onSelect={() => plan.isPrimary ? setIsPricingModalOpen(true) : onGetStarted()}
                />
              </motion.div>
            ))}
          </div>
        </section>

        <SoftDivider />

        {/* 5. Testimonials Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              O que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Confiança e resultados comprovados por quem usa o FLOW todos os dias.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.1 }}
                variants={sectionVariants}
              >
                <TestimonialCard {...testimonial} />
              </motion.div>
            ))}
          </div>
        </section>

        <SoftDivider />

        {/* 6. FAQ Section */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-gray-400">
              Tire suas dúvidas sobre o FLOW e comece a criar hoje mesmo.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <Accordion items={faqs} />
          </motion.div>
        </section>

        <SoftDivider />

        {/* 7. CTA Final */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            className="bg-indigo-600/10 border border-indigo-500/30 p-12 rounded-2xl shadow-2xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Pronto para Transformar Suas Ideias?
            </h2>
            <p className="text-xl text-indigo-200 mb-8">
              Comece a criar flyers incríveis com a ajuda da IA em menos de 5 minutos.
            </p>
            <Button size="lg" onClick={onGetStarted} className="text-lg px-10 py-6">
              <Download className="w-5 h-5 mr-2" />
              Começar Agora (É Grátis!)
            </Button>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-white/10 mt-10">
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <div className="mb-4 md:mb-0">
            © {new Date().getFullYear()} FLOW. Todos os direitos reservados.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-indigo-400 transition">Termos de Serviço</a>
            <a href="#" className="hover:text-indigo-400 transition">Política de Privacidade</a>
            <a href="#" className="hover:text-indigo-400 transition">Contato</a>
          </div>
        </div>
      </footer>

      {/* Modal de Preços */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSubscribe={() => alert("Redirecionando para checkout...")}
      />
    </div>
  );
};

export default LandingPage;