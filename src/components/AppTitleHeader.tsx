export const AppTitleHeader = () => {
  return (
    <div className="relative flex h-[12rem] md:h-[16rem] flex-col items-center justify-center w-full z-0 overflow-hidden">
      <div className="absolute top-0 z-0 h-48 w-[32rem] rounded-full bg-primary/50 blur-3xl" />
      <div className="relative z-10 flex flex-col items-center px-5">
        <h1 className="bg-gradient-to-br from-white to-gray-400 py-4 bg-clip-text text-center text-5xl md:text-7xl font-bold tracking-tighter text-transparent leading-[0.9] md:leading-[0.9]">
          Crie Artes <span className="text-white drop-shadow-[0_0_25px_rgba(139,92,246,0.6)]">Flow</span>
        </h1>
      </div>
    </div>
  );
};