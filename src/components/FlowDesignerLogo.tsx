import React from 'react';

interface FlowDesignerLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

// Replicando o logo estilizado em 'F' com as cores primárias e secundárias
export const FlowDesignerIcon: React.FC<FlowDesignerLogoProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    width={size} 
    height={size} 
    fill="none"
    {...props}
  >
    {/* Parte superior (Pink) */}
    <path 
      d="M 30 10 C 30 10 70 10 70 20 C 70 30 50 30 50 30 L 50 40 C 50 40 40 50 40 60 C 40 70 50 80 50 80 L 70 80 L 70 60 C 70 50 60 40 50 40 Z" 
      fill="#d946ef" 
      transform="scale(1.2) translate(-10, -5)"
    />
    {/* Parte inferior (Purple) */}
    <path 
      d="M 30 10 C 30 10 70 10 70 20 C 70 30 50 30 50 30 L 50 40 C 50 40 40 50 40 60 C 40 70 50 80 50 80 L 70 80 L 70 60 C 70 50 60 40 50 40 Z" 
      fill="#8b5cf6" 
      transform="scale(1.2) translate(-10, -5)"
    />
  </svg>
);

interface LogoTextProps {
    className?: string;
    iconSize?: number;
    logoUrl?: string | null; // NEW: Dynamic logo URL
}

export const FlowDesignerLogo: React.FC<LogoTextProps> = ({ className = '', iconSize = 24, logoUrl }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {logoUrl ? (
                <img 
                    src={logoUrl} 
                    alt="SaaS Logo" 
                    style={{ width: iconSize, height: iconSize }}
                    className="object-contain"
                />
            ) : (
                <FlowDesignerIcon size={iconSize} className="text-primary" />
            )}
            <span className="font-extrabold text-xl tracking-tight text-white">
                Flow<span className="text-primary">Designer</span>
            </span>
        </div>
    );
};