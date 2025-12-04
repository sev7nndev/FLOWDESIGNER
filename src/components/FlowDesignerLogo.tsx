import React from 'react';

interface FlowDesignerLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

// Simplified SVG based on the 'F' shape in the user's logo image
export const FlowDesignerIcon: React.FC<FlowDesignerLogoProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    width={size} 
    height={size} 
    {...props}
  >
    {/* Main 'F' shape - Pink/Purple gradient effect */}
    <path 
      d="M 50 0 C 50 0 70 10 70 30 C 70 50 50 60 50 60 L 50 100 L 30 100 L 30 30 C 30 10 50 0 50 0 Z" 
      fill="#D946EF" 
      transform="scale(0.8) translate(10, 0)"
    />
    {/* Secondary element (the wrap/scroll effect) */}
    <path 
      d="M 50 30 C 50 30 40 45 40 60 C 40 75 50 90 50 90 L 70 90 L 70 60 C 70 45 60 30 50 30 Z" 
      fill="#8b5cf6" 
      transform="scale(0.8) translate(10, 0)"
    />
    {/* Circle detail */}
    <circle cx="60" cy="50" r="5" fill="#D946EF" transform="scale(0.8) translate(10, 0)" />
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