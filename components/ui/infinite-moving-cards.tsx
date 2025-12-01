"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    quote: string;
    name: string;
    title: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);

  const [start, setStart] = useState(false);

  function addAnimation() {
    if (Peço desculpas, parece que eu estava tentando editar um arquivo que não existe no seu contexto (`components/ui/infinite-moving-cards.tsx`) e interrompi minha resposta.

Analisando o seu código, o carrossel de fotos está sendo renderizado no arquivo `components/LandingPage.tsx` usando uma lógica de duplicação manual e uma classe de animação chamada `animate-scroll`.

O problema de "ficar tudo preto" ocorre porque a animação CSS `scroll` move o conteúdo para fora da tela, e o conteúdo duplicado não é suficiente para preencher o espaço antes que a animação se repita.

Para corrigir isso, precisamos garantir que:

1.  A lista de itens seja duplicada o suficiente para preencher o espaço.
2.  A animação CSS `scroll` (definida em `tailwind.config.js`) seja ajustada para o tamanho correto do conteúdo duplicado.

### 1. Ajuste no `tailwind.config.js`

A animação `scroll` atual move o conteúdo em 100% (`'100%': { transform: 'translateX(-100%)' }`). Se duplicarmos o conteúdo, precisamos que a animação mova exatamente o tamanho de uma cópia completa do conteúdo original.

No seu `components/LandingPage.tsx`, você duplica o conteúdo uma vez: `const marqueeContent = [...carouselItems, ...carouselItems];`. Isso significa que a lista tem o dobro do tamanho. A animação deve mover 50% do total (que é 100% do conteúdo original) para criar o loop.

O `tailwind.config.js` já define:
```javascript
        'scroll': 'scroll 40s linear infinite',
      },
      keyframes: {
        // ...
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        // ...
```
Se o conteúdo for duplicado, `translateX(-100%)` move o dobro do que deveria, resultando no espaço vazio.

Vou criar uma nova animação chamada `marquee` que move o conteúdo em 50% (o tamanho da lista original) e aplicá-la.

<dyad-write path="tailwind.config.js" description="Adicionando um novo keyframe 'marquee' que move o conteúdo em 50% para garantir o loop infinito do carrossel.">
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Zinc 950
        surface: '#18181b',    // Zinc 900
        primary: '#8b5cf6',    // Violet 500
        secondary: '#d946ef',  // Fuchsia 500
        accent: '#06b6d4',     // Cyan 500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'scroll': 'scroll 40s linear infinite',
        'glow': 'glow 4s ease-in-out infinite', // Nova animação de brilho
        'marquee': 'marquee 40s linear infinite', // NOVA ANIMAÇÃO
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '-200% 0%' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        marquee: { // NOVO KEYFRAME
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }, // Move 50% do total (que é o tamanho da lista original)
        },
        glow: { // Novo keyframe para o brilho
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
};