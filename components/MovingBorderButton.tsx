"use client";
import React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function MovingBorderButton({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}: {
  borderRadius?: string;
  children: React.ReactNode;
  as?: any;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <Component
      className={cn(
        "bg-transparent relative p-[1px] overflow-hidden",
        containerClassName
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        {/* Removendo rx/ry daqui para que o MovingBorder use 100% do caminho retangular */}
        <MovingBorder duration={duration}> 
          <div
            className={cn(
              // Mantendo o tamanho ajustado para um efeito mais fino
              "h-6 w-6 opacity-[0.8] bg-[radial-gradient(theme(colors.primary)_40%,transparent_60%)]",
              borderClassName
            )}
          />
        </MovingBorder>
      </div>

      <div
        className={cn(
          "relative bg-background/80 border border-white/10 backdrop-blur-xl text-white flex items-center justify-center w-full h-full text-sm antialiased",
          className
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorder = ({
  children,
  duration = 4000,
  // Removendo rx e ry das props, pois não são usados no rect abaixo
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  [key: string]: any;
}) => {
  const pathRef = useRef<any>();
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    let length = 0;
    try {
      // Tenta obter o comprimento do caminho. Se o elemento não estiver pronto, pode lançar um erro.
      length = pathRef.current?.getTotalLength() || 0;
    } catch (e) {
      // Se getTotalLength falhar (caminho vazio), ignoramos este frame.
      return; 
    }
    
    if (length > 0) { 
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  // Função auxiliar para obter o ponto com segurança
  const getPoint = (val: number, coord: 'x' | 'y') => {
    try {
      const point = pathRef.current?.getPointAtLength(val);
      return point ? point[coord] : 0;
    } catch (e) {
      // Retorna 0 se houver erro (caminho vazio)
      return 0;
    }
  };

  const x = useTransform(progress, (val) => getPoint(val, 'x'));
  const y = useTransform(progress, (val) => getPoint(val, 'y'));

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect
          fill="none"
          // Mantendo o stroke transparente para garantir o cálculo do caminho
          stroke="transparent" 
          width="100%"
          height="100%"
          // Removendo rx e ry para usar o caminho retangular completo
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};