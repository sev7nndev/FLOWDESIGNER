// frontend/src/components/PricingCard.jsx
import React from 'react';
import { Check, Zap } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const PricingCard = ({ plan, highlight = false }) => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleSubscribe = async () => {
        if (!user) {
            alert("Por favor, faça login para assinar um plano.");
            return;
        }
        
        if (plan.price <= 0) {
            alert("Este é um plano gratuito. Você já está inscrito ou pode se cadastrar.");
            return;
        }

        setLoading(true);
        try {
            const initPoint = await apiService.createPaymentPreference(plan.id);
            window.location.href = initPoint; // Redireciona para o Mercado Pago
        } catch (error) {
            alert(`Erro ao iniciar pagamento: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        `${plan.image_quota} Imagens por mês`,
        `Qualidade ${highlight ? 'Ultra 8K' : '4K'}`,
        'Uso Comercial Liberado',
        highlight ? 'Suporte Prioritário' : 'Suporte por Email',
    ];

    return (
        <div className={`p-8 rounded-xl shadow-2xl flex flex-col transition-all duration-300 ${
            highlight 
                ? 'bg-indigo-600 text-white transform scale-105 border-4 border-yellow-400' 
                : 'bg-white text-gray-800 border border-gray-200 hover:shadow-xl'
        }`}>
            <h3 className={`text-2xl font-bold mb-2 ${highlight ? 'text-yellow-400' : 'text-indigo-600'}`}>{plan.name}</h3>
            <p className="text-sm mb-6">{highlight ? 'Melhor custo-benefício para profissionais.' : 'Ideal para começar.'}</p>

            <div className="flex items-baseline mb-6">
                <span className={`text-5xl font-extrabold ${highlight ? 'text-white' : 'text-gray-900'}`}>
                    R$ {plan.price}
                </span>
                <span className={`text-xl font-medium ml-2 ${highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                    /mês
                </span>
            </div>

            <ul className="space-y-3 flex-grow mb-8">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                        <Check size={18} className={`mr-3 ${highlight ? 'text-yellow-400' : 'text-green-500'}`} />
                        <span className={highlight ? 'text-indigo-100' : 'text-gray-600'}>{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={handleSubscribe}
                disabled={loading}
                className={`w-full py-3 font-semibold rounded-lg transition duration-300 flex items-center justify-center ${
                    highlight 
                        ? 'bg-yellow-400 text-indigo-900 hover:bg-yellow-500' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-50`}
            >
                {loading ? (
                    <Zap size={20} className="animate-spin mr-2" />
                ) : (
                    `Assinar ${plan.name}`
                )}
            </button>
        </div>
    );
};

export default PricingCard;