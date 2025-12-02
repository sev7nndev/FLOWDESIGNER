// frontend/src/components/HeroSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
    return (
        <div className="bg-indigo-700 text-white py-24 md:py-32">
            <div className="container mx-auto px-6 text-center">
                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-4">
                    Crie Artes Profissionais com IA
                </h1>
                <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                    Sua agência de design particular. Gere flyers, posts e banners de nível de estúdio em segundos.
                </p>
                <Link 
                    to="/auth" 
                    className="px-10 py-4 text-xl font-semibold text-indigo-700 bg-yellow-400 rounded-full hover:bg-yellow-500 transition duration-300 shadow-xl shadow-indigo-900/50"
                >
                    Começar Grátis
                </Link>
            </div>
        </div>
    );
};

export default HeroSection;