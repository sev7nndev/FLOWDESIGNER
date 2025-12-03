import React, { useMemo } from 'react';
import { User, EditablePlan } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/Button';
import { ArrowLeft, CheckCircle, CreditCard, Loader2, Lock, Zap } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

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
                <p>Plano não encontrado. <Button variant="link" onClick={onBack}>Voltar</Button></p>
            </div>
        );
    }

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        
        // Simulating payment processing
        setTimeout(() => {
            setIsProcessing(false);
            toast.success(`Assinatura do plano ${selectedPlan.display_name} realizada com sucesso!`);
            // In a real application, this would trigger a backend update and refresh user profile/usage
            onSuccess(); 
        }, 2000);
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
                                    Pagamento seguro e criptografado.
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna 2: Formulário de Pagamento */}
                    <div className="lg:col-span-2">
                        <Card className="bg-zinc-900 border border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <CreditCard size={20} /> Informações de Pagamento
                                </CardTitle>
                                <CardDescription className="text-gray-400">
                                    Preencha os dados do seu cartão de crédito.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="cardName" className="text-gray-300">Nome no Cartão</Label>
                                        <Input id="cardName" placeholder="Nome Completo" required className="bg-zinc-800 border-zinc-700 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cardNumber" className="text-gray-300">Número do Cartão</Label>
                                        <Input id="cardNumber" placeholder="XXXX XXXX XXXX XXXX" required className="bg-zinc-800 border-zinc-700 text-white" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="expiry" className="text-gray-300">Validade (MM/AA)</Label>
                                            <Input id="expiry" placeholder="MM/AA" required className="bg-zinc-800 border-zinc-700 text-white" />
                                        </div>
                                        <div className="space-y-2 col-span-1">
                                            <Label htmlFor="cvc" className="text-gray-300">CVC</Label>
                                            <Input id="cvc" placeholder="123" required className="bg-zinc-800 border-zinc-700 text-white" />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4">
                                        <Button 
                                            type="submit" 
                                            className="w-full h-12 text-lg"
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <><Loader2 size={20} className="animate-spin mr-2" /> Processando Pagamento...</>
                                            ) : (
                                                `Pagar ${formatPrice(selectedPlan.price)} Agora`
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