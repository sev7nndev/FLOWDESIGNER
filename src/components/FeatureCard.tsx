import React from 'react';
import { GlowingEffect } from './GlowingEffect';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'secondary' | 'accent';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  const colorClasses = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', hoverBorder: 'hover:border-primary/50', shadow: 'hover:shadow-primary/10' },
    secondary: { bg: 'bg-secondary/10', text: 'text-secondary', hoverBorder: 'hover:border-secondary/50', shadow: 'hover:shadow-secondary/10' },
    accent: { bg: 'bg-accent/10', text: 'text-accent', hoverBorder: 'hover:border-accent/50', shadow: 'hover:shadow-accent/10' }
  }[color];

  return (
    <div className={`relative h-full rounded-3xl p-6 md:p-8 bg-zinc-950/50 border border-white/10 shadow-xl transition-all duration-500 group ${colorClasses.hoverBorder} ${colorClasses.shadow}`}>
      <GlowingEffect disabled={false} proximity={40} spread={25} blur={12} />
      <div className="relative z-10 flex flex-col h-full">
        <div className={`${colorClasses.bg} w-fit p-3 rounded-xl mb-4 ${colorClasses.text}`}>{icon}</div>
        <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
        <p className="text-gray-400 text-sm flex-grow">{description}</p>
      </div>
    </div>
  );
};