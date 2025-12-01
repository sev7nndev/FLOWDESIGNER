import React from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
}

// Nota: Este é um mock simples de Tooltip, pois não temos as dependências completas do Radix/shadcn para Tooltip.
// Em um ambiente real, usaríamos @radix-ui/react-tooltip.
export const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
    return (
        <div className="relative inline-block group">
            {children}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs p-2 text-xs text-white bg-zinc-700 rounded-lg shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                {content}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-700" />
            </div>
        </div>
    );
};