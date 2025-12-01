"use client";

import React, { useState } from 'react';
import { PricingCard } from './PricingCard';
import { X, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { api } from '../services/api';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSelect: () => void; // Mantido para o plano Free
}

// Carrega o Stripe fora do componente para evitar recarregamentos
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onPlanSelect }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubscription = async (priceId: string) => {
    setIsLoading(priceId);
    setError(null);
    try {
      const { sessionId } = await api.createCheckoutSession(priceId);
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error("Stripe.js não foi carregado.");
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
      setIsLoading(null);
    }
  };

  // IDs dos planos que você configurou no .env.local e no Stripe
  const startPlanPriceId = "price_1PgQYwRvy5h55dM3lWzQ8dYq"; // Substitua pelo seu Price ID real
  const proPlanPriceId = "price_1PgQZJRvy5h55dM3eGjT9x7c";   // Substitua pelo seu Price ID real

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-primary/20 rounded-3xl w-full max-w-6xl p-8 md:p-12 shadow-2xl shadow-primary/20 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="text-center mb-10">
          <h3 className="text-3xl md:text-4xl font-bold text-white">Planos Flexíveis para o seu Sucesso</h3>
          <p className="text-gray-400 mt-3">Escolha o plano ideal e comece a criar. Cancele quando quiser.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <PricingCard 
            name="Free"
            price="R$ 0"
            description="Para testar a tecnologia."
            buttonText="Criar Conta Grátis"
            features={["3 Gerações Gratuitas", "Qualidade Padrão", "Marca d'água", "Suporte Comunitário"]}
            onClick={onPlanSelect}
          />
          <PricingCard 
            name="Start"
            price="R$ 29,99"
            period="/mês"
            description="Ideal para autônomos."
            buttonText={isLoading === startPlanPriceId ? "Processando..." : "Assinar Start"}
            features={["20 Imagens Profissionais", "Qualidade 4K", "Sem marca d'água", "Uso Comercial Liberado", "Suporte por Email"]}
            onClick={() => handleSubscription(startPlanPriceId)}
            isLoading={isLoading === startPlanPriceId}
          />
          <PricingCard 
            name="Pro"
            price="R$ 49,99"
            period="/mês"
            description="Para agências e power users."
            buttonText={isLoading === proPlanPriceId ? "Processando..." : "Assinar Pro"}
            features={["50 Imagens Profissionais", "Qualidade Ultra 8K", "Geração Instantânea (Turbo)", "Sem marca d'água", "Prioridade no Suporte"]}
            highlight={true}
            badge="Melhor Custo-Benefício"
            onClick={() => handleSubscription(proPlanPriceId)}
            isLoading={isLoading === proPlanPriceId}
          />
        </div>
        {error && <p className="text-red-400 text-center mt-6 text-sm">{error}</p>}
      </div>
    </div>
  );
};