import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'secondary' | 'accent';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  const colorClasses = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', hoverBorder: 'hover:border-primary/50', shadow: 'shadow-primary/10' },
    secondary: { bg: 'bg-secondary/10', text: 'text-secondary', hoverBorder: 'hover:border-secondary/50', shadow: 'shadow-secondary/10' },
    accent: { bg: 'bg-accent/10', text: 'text-accent', hoverBorder: 'hover:border-accent/50', shadow: 'shadow-accent/10' }
  }[color];

  return (
    <div className={`relative h-full rounded-3xl p-6 md:p-8 bg-zinc-900/50 border border-white/10 shadow-xl transition-all duration-500 group ${colorClasses.hoverBorder} hover:shadow-2xl hover:shadow-black/50`}>
      {/* Adicionando um gradiente sutil no fundo para profundidade */}
      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${colorClasses.bg}`} />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className={`${colorClasses.bg} w-fit p-3 rounded-xl mb-4 ${colorClasses.text} border border-white/10 group-hover:border-white/20 transition-colors`}>{icon}</div>
        <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
        <p className="text-gray-400 text-sm flex-grow">{description}</p>
      </div>
    </div>
  );
};