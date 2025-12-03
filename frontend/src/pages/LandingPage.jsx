// frontend/src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import PricingSection from '../components/PricingSection';
import Carousel from '../components/Carousel';

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
                <HeroSection />
                <Carousel />
                <PricingSection />
                <section className="py-16 text-center bg-indigo-50">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Pronto para começar?</h2>
                    <Link 
                        to="/auth" 
                        className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition duration-300 shadow-lg"
                    >
                        Comece a Criar Agora
                    </Link>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;