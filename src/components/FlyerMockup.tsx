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

export const FlyerMockup: React.FC<FlyerMockupProps> = ({ bg }) => {
  
  // O objetivo é exibir APENAS a imagem de fundo (bg) sem nenhum overlay ou texto.
  return (
    <div className="w-56 md:w-64 aspect-[3/4] rounded-xl overflow-hidden relative group flex-shrink-0 shadow-2xl border border-zinc-800">
      <img 
        src={bg} 
        loading="lazy" 
        className="w-full h-full object-cover" 
        alt="Arte Gerada por IA" 
      />
      {/* Todos os overlays, textos e badges foram removidos para atender ao pedido do usuário. */}
    </div>
  );
};