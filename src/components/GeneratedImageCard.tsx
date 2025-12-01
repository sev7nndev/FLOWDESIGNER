import React from 'react';

interface GeneratedImageCardProps {
    imageUrl: string;
    prompt: string;
}

const GeneratedImageCard: React.FC<GeneratedImageCardProps> = ({ imageUrl, prompt }) => {
    return (
        <div className="bg-zinc-900/90 border border-white/10 rounded-3xl p-4">
            <img src={imageUrl} alt={prompt} className="w-full h-auto rounded-2xl object-cover aspect-[3/4]" />
            <p className="text-gray-400 text-xs mt-3 truncate">Prompt: {prompt}</p>
        </div>
    );
};

export default GeneratedImageCard;