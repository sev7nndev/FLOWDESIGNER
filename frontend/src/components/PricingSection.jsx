// frontend/src/components/PricingSection.jsx
import React, { useState, useEffect } from 'react';
import PricingCard from './PricingCard';
import { apiService } from '../services/apiService';

const PricingSection = ({ fullPage = false }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await apiService.getPlans();
                // Ordena por preço
                const sortedPlans = data.sort((a, b) => a.price - b.price);
                setPlans(sortedPlans);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-600">Carregando planos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-600">Erro ao carregar planos: {error}</p>
            </div>
        );
    }

    // Determina qual plano destacar (o mais caro ou o segundo mais caro se houver 3)
    const highlightIndex = plans.length > 2 ? plans.length - 1 : plans.length - 1;

    return (
        <section className={`py-16 ${fullPage ? '' : 'bg-gray-50'}`}>
            <div className="container mx-auto px-6">
                {!fullPage && (
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-extrabold text-gray-900">Planos Flexíveis</h2>
                        <p className="text-lg text-gray-600 mt-2">Escolha o que melhor se adapta ao seu negócio.</p>
                    </div>
                )}
                
                <div className={`grid gap-8 ${plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'}`}>
                    {plans.map((plan, index) => (
                        <PricingCard 
                            key={plan.id} 
                            plan={plan} 
                            highlight={index === highlightIndex} 
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;