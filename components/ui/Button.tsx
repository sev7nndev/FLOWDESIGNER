import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Importando cn

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "relative group inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
  
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25",
    secondary: "bg-surface border border-white/10 hover:bg-white/5 text-gray-200",
    ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white border border-red-700/50 shadow-lg shadow-red-600/25"
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.95 }}
      className={cn(baseStyles, variants[variant], className)} // Usando cn
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Shimmer Effect */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
      
      <span className="relative flex items-center">
        {isLoading ? (
          <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
      </span>
    </motion.button>
  );
};