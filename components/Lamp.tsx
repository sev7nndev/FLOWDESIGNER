import { motion } from "framer-motion";

export const LampHeader = () => {
  return (
    <div className="relative flex h-[16rem] md:h-[24rem] flex-col items-center justify-center w-full z-0">
      <div className="w-full h-full relative [mask-image:linear-gradient(to_bottom,white,white,transparent)]">
        <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0 mt-[-4rem] md:mt-[-6rem]">
          
          {/* Lamp Left Beam - Converted to static div to prevent crash */}
          <div className="absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible">
            <div className="w-full h-full bg-gradient-conic from-primary via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]">
              <div className="absolute w-40 h-[100%] left-0 bg-background bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
            </div>
          </div>
          
          {/* Lamp Right Beam - Converted to static div to prevent crash */}
          <div className="absolute inset-auto left-1/2 h-56 w-[30rem] overflow-visible">
            <div className="w-full h-full bg-gradient-conic from-transparent via-transparent to-primary text-white [--conic-position:from_290deg_at_center_top]">
              <div className="absolute w-40 h-[100%] right-0 bg-background bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
            </div>
          </div>
          
          {/* Glow Effects */}
          <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-20 backdrop-blur-md"></div>
          <div className="absolute inset-auto z-50 h-48 w-[32rem] -translate-y-1/2 rounded-full bg-primary opacity-60 blur-3xl"></div>
          
          {/* Lamp Core */}
          <motion.div
            initial={{ width: "8rem" }}
            whileInView={{ width: "20rem" }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="absolute inset-auto z-30 h-48 w-80 -translate-y-[8rem] rounded-full bg-primary/80 blur-3xl"
          ></motion.div>
          
        </div>

        {/* Text Content */}
        <div className="relative z-50 flex -translate-y-[4rem] flex-col items-center px-5">
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
    </div>
  );
};