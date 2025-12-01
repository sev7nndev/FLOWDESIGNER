import { HoverBorderGradient } from "@/components/HoverBorderGradient";
import { ScrollFadeIn } from "@/components/ScrollFadeIn";

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-black text-white">
      {/* Seção Hero (Topo da Página) */}
      <section className="h-[80vh] w-full flex flex-col items-center justify-center text-center p-8">
        <ScrollFadeIn delay={0} className="max-w-4xl">
            <h1 className="text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-600">
                Acelere Seu Desenvolvimento
            </h1>
        </ScrollFadeIn>
        <ScrollFadeIn delay={0.2} className="max-w-4xl">
            <p className="text-xl text-gray-400 mb-8 max-w-2xl">
                Crie aplicações incríveis com componentes modernos e otimizados. Performance e design em primeiro lugar.
            </p>
        </ScrollFadeIn>
        <ScrollFadeIn delay={0.4}>
            <HoverBorderGradient className="text-lg font-semibold">
                Começar Agora
            </HoverBorderGradient>
        </ScrollFadeIn>
      </section>

      {/* Seção de Funcionalidade 1 */}
      <ScrollFadeIn className="w-full max-w-4xl py-28 border-t border-gray-800 text-center">
        <h2 className="text-4xl font-bold mb-4">Performance Otimizada</h2>
        <p className="text-lg text-gray-400">
          Utilizamos as melhores práticas de Next.js para garantir que sua página carregue em milissegundos, focando na experiência do usuário.
        </p>
      </ScrollFadeIn>

      {/* Seção de Funcionalidade 2 */}
      <ScrollFadeIn delay={0.1} className="w-full max-w-4xl py-28 text-center">
        <h2 className="text-4xl font-bold mb-4">Animações Suaves e Elegantes</h2>
        <p className="text-lg text-gray-400">
          Com Framer Motion, cada elemento entra na tela com um movimento fluido, criando uma experiência visualmente rica.
        </p>
      </ScrollFadeIn>

      {/* Seção de Chamada para Ação (CTA) */}
      <ScrollFadeIn className="w-full max-w-4xl py-28 border-t border-gray-800 mb-20 text-center">
        <h2 className="text-4xl font-bold mb-8">Pronto para Transformar Seu Projeto?</h2>
        <HoverBorderGradient className="text-lg font-semibold">
          Criar Minha Conta
        </HoverBorderGradient>
      </ScrollFadeIn>
    </main>
  );
}