import React from 'react';

interface FlowDesignerLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

// Simplified and corrected SVG based on the 'F' shape
export const FlowDesignerIcon: React.FC<FlowDesignerLogoProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    width={size} 
    height={size} 
    {...props}
  >
    {/* Main shape (F-like flow) - Using primary/secondary colors for gradient effect */}
    <path 
      d="M 30 0 L 70 0 C 85 0 100 15 100 30 L 100 70 C 100 85 85 100 70 100 L 30 100 C 15 100 0 85 0 70 L 0 30 C 0 15 15 0 30 0 Z" 
      fill="url(#flowGradient)" 
      opacity="0.1"
    />
    
    {/* Inner Flow Shape (The actual logo design) */}
    <path 
      d="M 50 10 L 50 90 L 30 90 L 30 30 C 30 15 50 10 50 10 Z" 
      fill="#D946EF" 
      transform="scale(0.8) translate(10, 0)"
    />
    <path 
      d="M 50 30 C 50 30 40 45 40 60 C 40 75 50 90 50 90 L 70 90 L 70 60 C 70 45 60 30 50 30 Z" 
      fill="#8b5cf6" 
      transform="scale(0.8) translate(10, 0)"
    />
    
    {/* Central Sparkle/Circle (Simplified) */}
    <circle cx="50" cy="50" r="10" fill="url(#sparkleGradient)" />
    
    {/* Definições de Gradiente */}
    <defs>
      <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#d946ef', stopOpacity: 1 }} />
      </linearGradient>
      <radialGradient id="sparkleGradient">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </radialGradient>
    </defs>
  </svg>
);

interface LogoTextProps {
    className?: string;
    iconSize?: number;
}

export const FlowDesignerLogo: React.FC<LogoTextProps> = ({ className = '', iconSize = 24 }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <FlowDesignerIcon size={iconSize} className="text-primary" />
            <span className="font-extrabold text-xl tracking-tight text-white">
                Flow<span className="text-primary">Designer</span>
            </span>
        </div>
    );
};