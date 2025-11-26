import { motion } from "framer-motion";
import { SparklesCore } from "./Sparkles";

export const LampHeader = () => {
  return (
    <div className="relative flex h-[12rem] md:h-[18rem] flex-col items-center justify-center w-full z-0">
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0 mt-[-4rem] md:mt-[-6rem]">
        
        {/* Lamp Left Beam */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-primary via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          {/* Mantendo apenas a máscara lateral para evitar que o feixe se estenda para fora */}
          <div className="absolute w-40 h-[100%] left-0 bg-background bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        
        {/* Lamp Right Beam */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-primary text-white [--conic-position:from_290deg_at_center_top]"
        >
          {/* Mantendo apenas a máscara lateral para evitar que o feixe se estenda para fora */}
          <div className="absolute w-40 h-[100%] right-0 bg-background bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
        </motion.div>
        
        {/* Glow Effects */}
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-primary opacity-50 blur-3xl"></div>
        
        {/* Lamp Core */}
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-primary/80 blur-2xl"
        ></motion.div>
        
        {/* Lamp Line */}
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-primary "
        ></motion.div>
      </div>

      {/* Sparkles Integration */}
      <div className="absolute z-40 w-full h-full top-0 left-0 pointer-events-none">
        <SparklesCore
          id="tsparticleslamp"
          background="transparent"
          minSize={0.4}
          maxSize={1.2}
          particleDensity={50}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={0.5}
        />
      </div>

      {/* Text Content - TITLE ONLY, GIANT */}
      {/* Adjusted translation to push the title down relative to the Lamp container */}
      <div className="relative z-50 flex -translate-y-[2rem] flex-col items-center px-5">
        <motion.h1
          initial={{ opacity: 0.5, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="bg-gradient-to-br from-white to-gray-400 py-4 bg-clip-text text-center text-5xl md:text-7xl font-bold tracking-tighter text-transparent leading-[0.9] md:leading-[0.9]"
        >
          Flow <span className="text-white drop-shadow-[0_0_25px_rgba(139,92,246,0.6)]">Designer</span>
        </motion.h1>
      </div>
    </div>
  );
};