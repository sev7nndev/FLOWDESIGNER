import React from 'react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: 'primary' | 'secondary' | 'accent';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
    const colorClasses = {
        primary: { bg: 'bg-primary/10', text: 'text-primary', hoverBorder: 'hover:border-primary/50', shadow: 'hover:shadow-primary/10', gradient: 'from-primary/5 to-transparent' },
        secondary: { bg: 'bg-secondary/10', text: 'text-secondary', hoverBorder: 'hover:border-secondary/50', shadow: 'hover:shadow-secondary/10', gradient: 'from-secondary/5 to-transparent' },
        accent: { bg: 'bg-accent/10', text: 'text-accent', hoverBorder: 'hover:border-accent/50', shadow: 'hover:shadow-accent/10', gradient: 'from-accent/5 to-transparent' }
    }[color];

    return (
        <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 bg-zinc-900/80 border border-white/10 shadow-xl transition-all duration-500 group ${colorClasses.hoverBorder} ${colorClasses.shadow}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
                <div className={`${colorClasses.bg} w-fit p-3 rounded-xl mb-4 ${colorClasses.text}`}>{icon}</div>
                <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
                <p className="text-gray-400 text-sm">{description}</p>
            </div>
        </div>
    );
};