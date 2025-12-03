import React, { useMemo } from 'react';
import { User, EditablePlan } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/Button';
import { ArrowLeft, CheckCircle, CreditCard, Loader2, Lock, Zap } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { api } from '@/services/api'; // Import API service

interface CheckoutPageProps {
    user: User;
    planId: string;
    plans: EditablePlan[];
    onBack: () => void;
    onSuccess: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ user, planId, plans, onBack, onSuccess }) => {
    const selectedPlan = useMemo(() => plans.find(p => p.id === planId), [planId, plans]);
    const [isProcessing, setIsProcessing] = React.useState(false);

    if (!selectedPlan) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
                <p>Plano não encontrado. <Button variant="ghost" onClick={onBack}>Voltar</Button></p>
            </div>
        );
    }

    // --- REAL PAYMENT INITIATION ---
    const handlePaymentInitiation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        
        try {
            // 1. Call backend to initiate subscription/payment preference
            const { paymentUrl } = await api.initiateSubscription(planId);
            
            toast.info("Redirecionando para o pagamento seguro...");
            
            // 2. Redirect user to the payment gateway (Mercado Pago)
            window.location.href = paymentUrl;
            
            // Note: onSuccess is handled by the backend webhook after payment approval.
            // We don't call onSuccess here, as the user is leaving the app.
            
        } catch (e: any) {
            console.error("Payment initiation failed:", e);
            toast.error(e.message || "Falha ao iniciar o pagamento. Tente novamente mais tarde.");
        } finally {
            setIsProcessing(false);
        }
    };

    const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center pt-16 pb-10 px-4">
            <div className="w-full max-w-4xl relative">
                <Button 
                    variant="ghost" 
                    onClick={onBack} 
                    className="absolute top-0 left-0 text-gray-400 hover:text-white hidden md:flex"
                >
                    <ArrowLeft size={16} className="mr-2" /> Voltar aos Planos
                </Button>
                
                <div className="text-center mb-12 mt-8 md:mt-0">
                    <h1 className="text-4xl font-bold text-white">Finalizar Assinatura</h1>
                    <p className="text-gray-400 mt-2">Você está a um passo de liberar o poder total da I.A.!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Coluna 1: Detalhes do Plano */}
                    <div className="lg:col-span-1">
                        <Card className="bg-zinc-900 border border-primary/20 shadow-lg shadow-primary/10 h-full">
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2">
                                    <Zap size={20} /> {selectedPlan.display_name}
                                </CardTitle>
                                <CardDescription className="text-gray-300">
                                    {selectedPlan.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-extrabold text-white mb-4">
                                    {formatPrice(selectedPlan.price)}<span className="text-lg font-medium text-gray-400">/mês</span>
                                </div>
                                <ul className="space-y-3 text-sm text-gray-300">
                                    {selectedPlan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <CheckCircle size={16} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 p-4 bg-zinc-800 rounded-lg text-sm text-gray-400 flex items-center">
                                    <Lock size={16} className="mr-2 flex-shrink-0" />
                                    Pagamento seguro via Mercado Pago.
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna 2: Formulário de Pagamento (Simplified to a CTA for MP Redirect) */}
                    <div className="lg:col-span-2">
                        <Card className="bg-zinc-900 border border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <CreditCard size={20} /> Redirecionamento de Pagamento
                                </CardTitle>
                                <CardDescription className="text-gray-400">
                                    Clique abaixo para ser redirecionado ao ambiente seguro do Mercado Pago e finalizar sua compra.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePaymentInitiation} className="space-y-6">
                                    {/* Removed unnecessary input fields as MP handles them */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-300">Email do Pagador</Label>
                                        <Input id="email" value={user.email} disabled className="bg-zinc-800 border-zinc-700 text-white/70" />
                                    </div>
                                    
                                    <div className="pt-4">
                                        <Button 
                                            type="submit" 
                                            className="w-full h-12 text-lg"
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <><Loader2 size={20} className="animate-spin mr-2" /> Preparando Pagamento...</>
                                            ) : (
                                                `Pagar ${formatPrice(selectedPlan.price)} via Mercado Pago`
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};