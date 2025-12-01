import { Hero } from "@/components/Hero";
import { HoverBorderGradient } from "@/components/HoverBorderGradient";
import { BeamsBackground } from "@/components/BeamsBackground";

export default function Home() {
  return (
    <BeamsBackground>
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <Hero />
        <HoverBorderGradient>
          Começar Agora
        </HoverBorderGradient>
      </main>
    </BeamsBackground>
  );
}