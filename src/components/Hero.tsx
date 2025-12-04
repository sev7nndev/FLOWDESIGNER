import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import { Button } from "./Button";
import { ShaderBackground } from "./ShaderBackground"; // Import the new background

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["incríveis", "novas", "maravilhosas", "lindas", "inteligentes"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  // Estilo de sombra de texto para garantir legibilidade sobre o fundo brilhante
  const textShadowStyle = {
    textShadow: '0 0 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.6)',
  };

  return (
    <div className="w-full relative h-full">

      {/* Shader Background */}
      <ShaderBackground className="z-0 opacity-70" />
      {/* <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900/50 via-black to-pink-900/30 opacity-70" /> */}

      {/* Content Overlay */}
      <div className="relative z-20 container mx-auto h-full">
        <div className="flex gap-8 py-16 lg:py-24 items-center justify-center flex-col text-center px-4 h-full">

          {/* Content Wrapper (Removed backdrop blur) */}
          <div className="max-w-4xl">
            <div className="flex gap-4 flex-col">
              <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tighter font-regular" style={textShadowStyle}>
                <span className="text-white">Crie artes</span>
                <span className="relative flex w-full justify-center overflow-hidden md:pb-4 md:pt-1 h-16 md:h-24">
                  &nbsp;
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="absolute font-semibold text-primary"
                      initial={{ opacity: 0, y: "-100" }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? {
                            y: 0,
                            opacity: 1,
                          }
                          : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                      }
                      style={textShadowStyle} // Aplicando sombra também ao texto dinâmico
                    >
                      {title}
                    </motion.span>
                  ))}
                </span>
              </h1>

              <p className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-400 max-w-2xl mx-auto" style={textShadowStyle}>
                Gerenciar um pequeno negócio já é difícil. Evite mais complicações e abandone métodos ultrapassados. Nosso objetivo é otimizar a criação de artes para PMEs, tornando tudo mais fácil e rápido do que nunca.
              </p>
            </div>
            <div className="flex flex-row gap-3 mt-8">
              <Button onClick={onGetStarted} className="gap-4 h-14 px-8 text-lg mx-auto">
                Começar Agora <MoveRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};