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
    <div className={`relative rounded-3xl p-8 flex flex-col h-full transition-transform duration-300 hover:-translate-y-2 ${
      highlight 
        ? 'bg-zinc-900/80 border border-primary/50 shadow-2xl shadow-primary/20 z-10 scale-105' 
        : 'bg-zinc-900/40 border border-white/5 hover:border-white/10'
    }`}>
      {highlight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h4 className={`text-lg font-bold mb-2 ${highlight ? 'text-primary' : 'text-white'}`}>{name}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl md:text-4xl font-bold text-white">{price}</span>
          {period && <span className="text-gray-500 text-sm">{period}</span>}
        </div>
        <p className="text-gray-400 text-sm mt-2">{description}</p>
      </div>

      <div className="flex-grow space-y-4 mb-8">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 p-0.5 rounded-full ${highlight ? 'bg-primary/20 text-primary' : 'bg-white/10 text-gray-400'}`}>
              <Check size={12} />
            </div>
            <span className="text-gray-300 text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={onClick}
        className={`w-full h-12 rounded-xl text-sm font-bold ${
          highlight 
            ? 'bg-gradient-to-r from-primary to-secondary hover:brightness-110 shadow-lg shadow-primary/25' 
            : 'bg-white text-black hover:bg-gray-200 border-0'
        }`}
      >
        {buttonText}
      </Button>
    </div>
  );
};