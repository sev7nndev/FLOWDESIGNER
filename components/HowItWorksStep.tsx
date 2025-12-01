import React from 'react';

interface HowItWorksStepProps {
    icon: React.ReactNode; 
    number: string;
    title: string;
    description: string;
    stepNumber: number; 
    isRight: boolean; 
}

// FIX: Removed stepNumber from destructuring as it's not used in the component body (Error 7)
export const HowItWorksStep: React.FC<HowItWorksStepProps> = ({ icon, number, title, description, isRight }) => ( 
    <div className={`relative p-6 bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-primary/20 hover:-translate-y-1 group ${isRight ? 'md:ml-auto md:w-[calc(50%-1rem)]' : 'md:mr-auto md:w-[calc(50%-1rem)]'}`}>
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    {icon}
                </div>
                {/* Enhanced visual separation for the number */}
                <span className="text-5xl font-extrabold text-white/10 absolute right-4 top-0">{number}</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    </div>
);