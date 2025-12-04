import React, { useState, useCallback, useEffect } from 'react';
import { Settings, Loader2, Save } from 'lucide-react';
import { Button } from '../Button';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { EditablePlan, UserRole } from '@/types';

export const PlanSettingsManager: React.FC = () => {
    const [plans, setPlans] = useState<EditablePlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedPlans = await api.getPlanSettings();
            setPlans(fetchedPlans.sort((a: EditablePlan, b: EditablePlan) => a.price - b.price));
        } catch (e: any) {
            setError(e.message || "Falha ao carregar planos.");
            toast.error("Falha ao carregar planos.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleInputChange = (id: UserRole, field: keyof EditablePlan, value: string) => {
        setPlans(prev => prev.map(p => {
            if (p.id !== id) return p;
            
            if (field === 'price') {
                return { ...p, price: parseFloat(value) || 0 };
            }
            if (field === 'max_images_per_month') {
                return { ...p, max_images_per_month: parseInt(value) || 0 };
            }
            if (field === 'features') {
                return { ...p, features: value.split('\n').map((f: string) => f.trim()).filter((f: string) => f.length > 0) };
            }
            
            return { ...p, [field]: value };
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const validPlans = plans.map(p => ({
                ...p,
                price: parseFloat(p.price.toFixed(2)),
                max_images_per_month: Math.max(0, p.max_images_per_month),
                features: Array.isArray(p.features) ? p.features : (p.features as string).split('\n').map((f: string) => f.trim()).filter((f: string) => f.length > 0)
            }));
            
            await api.updatePlanSettings(validPlans);
            toast.success("Configurações de planos salvas com sucesso!");
            fetchPlans();
        } catch (e: any) {
            setError(e.message || "Falha ao salvar configurações.");
            toast.error(e.message || "Falha ao salvar configurações.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Settings size={20} className="text-primary" /> Configuração de Planos (Dev)
            </h3>
            
            {isLoading && <div className="text-center py-10"><Loader2 size={20} className="animate-spin text-primary" /></div>}
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}

            <div className="space-y-6">
                {plans.map((plan: EditablePlan) => (
                    <div key={plan.id} className="p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                        <h4 className="text-lg font-semibold text-white uppercase mb-3">{plan.id}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome de Exibição</label>
                                <input 
                                    type="text" 
                                    value={plan.display_name}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'display_name', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Preço (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={plan.price}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'price', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Descrição Curta</label>
                                <input 
                                    type="text" 
                                    value={plan.description}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'description', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Limite Mensal (Imagens)</label>
                                <input 
                                    type="number" 
                                    value={plan.max_images_per_month}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'max_images_per_month', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Recursos (Um por linha)</label>
                                <textarea 
                                    rows={4}
                                    value={plan.features.join('\n')}
                                    onChange={(e) => handleInputChange(plan.id as UserRole, 'features', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <Button onClick={handleSave} isLoading={isSaving} className="w-full h-10 text-sm mt-4" icon={<Save size={16} />}>
                Salvar Configurações de Planos
            </Button>
        </div>
    );
};