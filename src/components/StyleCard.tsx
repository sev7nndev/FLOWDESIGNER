import React from 'react';
import { ArtStyle } from '../types';
import * as Icons from 'lucide-react';

interface StyleCardProps {
  style: ArtStyle;
  isSelected: boolean;
  onClick: () => void;
}

export const StyleCard: React.FC<StyleCardProps> = ({ style, isSelected, onClick }) => {
  // Dynamically get icon component
  const IconComponent = (Icons as any)[style.iconName] || Icons.Sparkles;

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden p-4 rounded-xl border transition-all duration-300 text-left w-full h-24 flex flex-col justify-between ${
        isSelected 
          ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
          : 'border-white/5 bg-surface/50 hover:bg-surface hover:border-white/10'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${style.previewColor} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="flex justify-between items-start z-10">
        <IconComponent 
          size={24} 
          className={`transition-colors duration-300 ${isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`} 
        />
        {isSelected && (
           <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        )}
      </div>
      
      <span className={`text-sm font-medium z-10 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
        {style.name}
      </span>
    </button>
  );
};
