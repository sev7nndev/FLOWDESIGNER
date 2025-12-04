import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import { Button } from "./Button";

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

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col text-center">
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tighter font-regular">
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
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-400 max-w-2xl mx-auto">
              Gerenciar um pequeno negócio já é difícil. Evite mais complicações e abandone métodos ultrapassados. Nosso objetivo é otimizar a criação de artes para PMEs, tornando tudo mais fácil e rápido do que nunca.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button onClick={onGetStarted} className="gap-4 h-14 px-8 text-lg">
              Começar Agora <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};