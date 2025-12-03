import React from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="border-b border-white/5">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full py-4 flex items-center justify-between text-left text-white hover:text-primary transition-colors"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 pb-4' : 'max-h-0'}`}>
        <p className="text-gray-400 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
};