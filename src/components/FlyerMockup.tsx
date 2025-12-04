import React from 'react';
import { Phone, Shield } from 'lucide-react';

export interface FlyerMockupProps {
  bg: string;
  title: string;
  subtitle: string;
  phone: string;
  theme: 'mechanic' | 'food' | 'law' | 'tech';
  badge: string;
  price?: string;
}

export const FlyerMockup: React.FC<FlyerMockupProps> = ({ bg, title, subtitle, phone, theme, badge, price }) => {
  
  // --- LAYOUT 1: MECÂNICA (Agressivo, Diagonal, Dark) ---
  if (theme === 'mechanic') {
    return (
      <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800">
        <img src={bg} loading="lazy" className="w-full h-full object-cover transform transition-transform duration-700" alt={title} />
        {/* Overlay Diagonal */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-900/90 skew-y-6 transform origin-bottom-right translate-y-4 border-t-4 border-red-600" />
        
        {/* Content */}
        <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
          <div className="self-end">
            <div className="bg-red-600 text-white text-xs font-black italic uppercase px-3 py-1 skew-x-[-10deg] shadow-lg">
              {badge}
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-3xl font-black text-white italic uppercase leading-none drop-shadow-md tracking-tighter">
              {title}
            </h3>
            <div className="w-16 h-1.5 bg-red-600 my-2 skew-x-[-20deg]" />
            <p className="text-gray-300 text-[10px] font-bold uppercase tracking-wide mb-3">
              {subtitle}
            </p>
            <div className="flex items-center gap-2 bg-black/60 p-2 rounded-lg border border-white/10 backdrop-blur-sm w-fit">
              <Phone size={12} className="text-red-500" />
              <span className="text-white text-xs font-bold">{phone}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 2: GASTRONOMIA (Varejo, Preço em Destaque, Quente) ---
  if (theme === 'food') {
    return (
      <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800">
        <img src={bg} loading="lazy" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" alt={title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        {/* Badge de Preço Circular */}
        <div className="absolute top-4 right-4 bg-yellow-500 w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.6)] rotate-12 group-hover:rotate-0 transition-transform border-2 border-white border-dashed">
          <span className="text-[8px] font-bold text-red-900 uppercase">Apenas</span>
          <span className="text-lg font-black text-red-900 leading-none">{price}</span>
        </div>

        <div className="absolute bottom-0 w-full p-5 text-center">
          <div className="bg-red-600/90 backdrop-blur-md p-4 rounded-t-2xl border-t border-yellow-500/50 shadow-lg">
            <h3 className="text-2xl font-black text-yellow-400 uppercase drop-shadow-md font-sans mb-1">
              {title}
            </h3>
            <p className="text-white text-[10px] font-medium leading-tight mb-2">
              {subtitle}
            </p>
            <div className="bg-white/10 rounded-full py-1 px-3 inline-block">
              <span className="text-white text-[10px] font-bold flex items-center gap-1 justify-center">
                <Phone size={8} /> {phone}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 3: JURÍDICO (Sóbrio, Elegante, Dourado) ---
  if (theme === 'law') {
    return (
      <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800 bg-slate-900">
        <div className="h-2/3 overflow-hidden relative">
           <img src={bg} loading="lazy" className="w-full h-full object-cover transition-all duration-700" alt={title} />
           <div className="absolute inset-0 bg-slate-900/30" />
        </div>
        
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center border-t border-amber-500/30">
          <div className="w-8 h-8 mb-3 text-amber-500 border border-amber-500/50 rounded flex items-center justify-center">
            <Shield size={16} />
          </div>
          <h3 className="text-lg font-serif font-bold text-white uppercase tracking-widest mb-1">
            {title}
          </h3>
          <div className="w-8 h-px bg-amber-500 my-2" />
          <p className="text-slate-400 text-[9px] uppercase tracking-wide mb-4 line-clamp-2">
            {subtitle}
          </p>
          <span className="text-amber-500 text-[10px] font-serif border border-amber-500/30 px-4 py-1 rounded-sm">
            {phone}
          </span>
        </div>
      </div>
    );
  }

  // --- LAYOUT 4: TECH / OFERTAS (Glassmorphism, Neon) ---
  return (
    <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800">
      <img src={bg} loading="lazy" className="w-full h-full object-cover" alt={title} />
      <div className="absolute inset-0 bg-blue-900/30 mix-blend-overlay" />
      
      {/* Glass Card Center */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center w-full shadow-[0_8px_32px_rgba(0,0,0,0.37)] group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-cyan-500/30 blur-xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-purple-500/30 blur-xl rounded-full pointer-events-none" />
          
          <span className="bg-cyan-500 text-black text-[8px] font-bold uppercase px-2 py-0.5 rounded mb-3 inline-block">
            {badge}
          </span>
          <h3 className="text-xl font-bold text-white mb-2 leading-tight tracking-tight">
            {title}
          </h3>
          <p className="text-cyan-100 text-[9px] mb-3 leading-tight">
            {subtitle}
          </p>
          <div className="text-white font-mono text-[10px] bg-black/30 rounded py-1 border border-white/5">
            {phone}
          </div>
        </div>
      </div>
    </div>
  );
};