// frontend/src/pages/PricingPage.jsx
import React from 'react';
import Navbar from '../components/Navbar';
import PricingSection from '../components/PricingSection';

const PricingPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto p-6 py-12">
                <h1 className="text-5xl font-extrabold text-center text-gray-900 mb-10">
                    Escolha o Plano Perfeito
                </h1>
                <PricingSection fullPage={true} />
            </main>
        </div>
    );
};

export default PricingPage;