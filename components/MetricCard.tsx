import React from 'react';
import { cn } from '../lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'red' | 'gray';
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    secondary: 'text-secondary bg-secondary/10 border-secondary/20',
    accent: 'text-accent bg-accent/10 border-accent/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
    gray: 'text-gray-400 bg-gray-700/10 border-gray-700/20',
  }[color];

  return (
    <div className={cn(
      "p-5 rounded-xl border bg-zinc-900/50 shadow-lg transition-all hover:shadow-xl",
      colorClasses
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</span>
        <div className={cn("p-2 rounded-full", colorClasses)}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-extrabold text-white mt-3">{value}</p>
    </div>
  );
};