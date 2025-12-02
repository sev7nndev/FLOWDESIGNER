// frontend/src/components/QuotaDisplay.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { Zap, Loader2 } from 'lucide-react';

const QuotaDisplay = ({ onQuotaUpdate }) => {
    const { user, profile } = useAuth();
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsage = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getUsage(user.id);
            setUsage(data);
            if (onQuotaUpdate) {
                onQuotaUpdate(data);
            }
        } catch (e) {
            setError('Não foi possível carregar a quota.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, onQuotaUpdate]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-md">
                <Loader2 size={20} className="animate-spin mr-2 text-indigo-500" />
                <p className="text-sm text-gray-600">Carregando quota...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
            </div>
        );
    }

    const { current, limit, isUnlimited } = usage;
    const remaining = isUnlimited ? 'Ilimitado' : limit - current;
    const percentage = isUnlimited ? 100 : (current / limit) * 100;
    const isLow = !isUnlimited && remaining <= 5 && remaining > 0;
    const isExceeded = !isUnlimited && remaining <= 0;

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-indigo-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Zap size={24} className="text-indigo-500 mr-2" />
                    Uso de Imagens
                </h3>
                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                    isUnlimited ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                    {isUnlimited ? 'Ilimitado' : `Plano ${profile?.role || 'Free'}`}
                </span>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>{current} de {isUnlimited ? '∞' : limit}</span>
                    {isLow && <span className="text-yellow-600">Quota Baixa!</span>}
                    {isExceeded && <span className="text-red-600">Quota Esgotada!</span>}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                            isExceeded ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-indigo-500'
                        }`} 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                </div>
            </div>

            <p className="text-sm text-gray-500">
                {isExceeded ? (
                    <>
                        Sua quota esgotou. <a href="/pricing" className="text-indigo-600 hover:underline">Faça upgrade</a> para continuar criando.
                    </>
                ) : isUnlimited ? (
                    'Você tem uso ilimitado de imagens.'
                ) : (
                    `Você pode gerar mais ${remaining} imagens este mês.`
                )}
            </p>
        </div>
    );
};

export default QuotaDisplay;