import React from 'react';
import { Check } from 'lucide-react';
import { Button } from './Button';

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  buttonText: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  onClick: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({ 
  name, price, period, description, buttonText, features, highlight, badge, onClick 
}) => {
  return (
    <div className={`relative rounded-3xl p-8 flex flex-col h-full transition-all duration-300 ${
      highlight 
        ? 'bg-zinc-900/90 border-2 border-primary shadow-[0_0_40px_rgba(139,92,246,0.4)] z-10 scale-[1.02] hover:scale-[1.05]' 
        : 'bg-zinc-900/40 border border-white/10 hover:border-white/20 hover:-translate-y-1'
    }`}>
      {highlight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl shadow-primary/50">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h4 className={`text-xl font-bold mb-2 ${highlight ? 'text-primary' : 'text-white'}`}>{name}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl md:text-5xl font-extrabold text-white">{price}</span>
          {period && <span className="text-gray-500 text-sm">{period}</span>}
        </div>
        <p className="text-gray-400 text-sm mt-2">{description}</p>
      </div>

      <div className="flex-grow space-y-4 mb-8">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 p-0.5 rounded-full ${highlight ? 'bg-primary/30 text-primary' : 'bg-white/10 text-gray-400'}`}>
              <Check size={14} />
            </div>
            <span className="text-gray-300 text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={onClick}
        className={`w-full h-14 rounded-xl text-base font-bold ${
          highlight 
            ? 'bg-gradient-to-r from-primary to-secondary hover:brightness-110 shadow-xl shadow-primary/30' 
            : 'bg-white text-black hover:bg-gray-200 border-0'
        }`}
      >
        {buttonText}
      </Button>
    </div>
  );
};