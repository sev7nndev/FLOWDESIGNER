import React from 'react';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
    name: string;
    role: string;
    text: string;
    stars: number;
    image: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ name, role, text, stars, image }) => (
  <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
    <div className="flex gap-1 mb-4">
      {[...Array(stars)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
    </div>
    <p className="text-gray-300 text-sm italic mb-4">"{text}"</p>
    <div className="flex items-center gap-3">
      {/* User Photo */}
      <img src={image} alt={name} className="h-10 w-10 rounded-full object-cover border border-primary/50 p-[2px]" />
      <div>
        <h5 className="text-white text-sm font-bold">{name}</h5>
        <span className="text-gray-500 text-xs">{role}</span>
      </div>
    </div>
  </div>
);