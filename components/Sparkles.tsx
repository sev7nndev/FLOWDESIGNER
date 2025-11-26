import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Helper function to replace cn
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

export const SparklesCore = (props: ParticlesProps) => {
  const {
    id,
    className,
    background,
    minSize = 0.4,
    maxSize = 1,
    speed = 1,
    particleColor = "#FFFFFF",
    particleDensity = 100,
  } = props;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [particles, setParticles] = useState<any[]>([]);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    if (canvasRef.current) {
      setContext(canvasRef.current.getContext("2d"));
    }
  }, []);

  useEffect(() => {
    if (context && canvasRef.current) {
      const canvas = canvasRef.current;
      const { width, height } = canvas.getBoundingClientRect();
      
      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const particleCount = particleDensity;
      const newParticles = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * (maxSize - minSize) + minSize,
          speedX: (Math.random() - 0.5) * speed * 0.5,
          speedY: (Math.random() - 0.5) * speed * 0.5,
          opacity: Math.random(),
        });
      }
      setParticles(newParticles);
    }
  }, [context, minSize, maxSize, speed, particleDensity]);

  useEffect(() => {
    if (context && canvasRef.current) {
      const canvas = canvasRef.current;
      
      const render = () => {
        const { width, height } = canvas.getBoundingClientRect();
        context.clearRect(0, 0, width, height);
        
        // Draw background if needed
        if (background && background !== 'transparent') {
          context.fillStyle = background;
          context.fillRect(0, 0, width, height);
        }

        particles.forEach((particle) => {
          particle.x += particle.speedX;
          particle.y += particle.speedY;

          // Wrap around screen
          if (particle.x < 0) particle.x = width;
          if (particle.x > width) particle.x = 0;
          if (particle.y < 0) particle.y = height;
          if (particle.y > height) particle.y = 0;
          
          // Draw particle
          context.globalAlpha = particle.opacity;
          context.fillStyle = particleColor;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
        });

        animationFrameId.current = requestAnimationFrame(render);
      };

      render();

      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    }
  }, [context, particles, background, particleColor]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={cn("relative w-full h-full", className)}
    >
      <canvas
        ref={canvasRef}
        id={id}
        className="w-full h-full block"
      />
    </motion.div>
  );
};