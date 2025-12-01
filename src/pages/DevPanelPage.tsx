import React from 'react';
import { User } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, LogOut, Settings, Zap, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useDevSettings } from '../hooks/useDevSettings';
import { Input } from '../components/Input';

interface DevPanelPageProps {
    user: User;
    onBackToApp: () => void;
    onLogout: () => Promise<void>;
}

export const DevPanelPage: React.FC<DevPanelPageProps> = ({ user, onBackToApp, onLogout }) => {
    const { settings, updateSetting, resetSettings } = useDevSettings();

    if (user.role !== 'dev') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
                <p className="text-red-400">Acesso negado. Apenas para Desenvolvedores.</p>
            </div>
        );
    }

    const handleToggleAi = () => {
        updateSetting('isAiOnline', !settings.isAiOnline);
    };

    const handleLatencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        updateSetting('mockLatencyMs', isNaN(value) ? 0 : value);
    };

    const handleErrorRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseFloat(e.target.value);
        if (isNaN(value)) value = 0;
        value = Math.max(0, Math.min(1.0, value)); // Clamp between 0 and 1
        updateSetting('mockErrorRate', value);
    };

    const handleMockErrorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateSetting('mockErrorType', e.target.value as typeof settings.mockErrorType);
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-8 text-white">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                    <h1 className="text-3xl font-bold flex items-center text-cyan-400">
                        <Settings size={28} className="mr-2" />
                        Painel do Desenvolvedor
                    </h1>
                    <div className="space-x-3">
                        <Button variant="secondary" onClick={onBackToApp} icon={<ArrowLeft size={18} />}>
                            Voltar para o App
                        </Button>
                        <Button variant="danger" onClick={onLogout} icon={<LogOut size={18} />}>
                            Sair
                        </Button>
                    </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-xl shadow-2xl border border-zinc-800 space-y-8">
                    <h2 className="text-xl font-semibold text-white border-b border-zinc-700 pb-3">
                        Controle de Mock de API
                    </h2>

                    {/* AI Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                        <div className="flex items-center">
                            <Zap size={24} className={settings.isAiOnline ? 'text-green-400' : 'text-red-400'} />
                            <span className="ml-3 font-medium">Status da IA de Geração</span>
                        </div>
                        <Button 
                            variant={settings.isAiOnline ? 'danger' : 'primary'}
                            onClick={handleToggleAi}
                        >
                            {settings.isAiOnline ? 'Desligar IA' : 'Ligar IA'}
                        </Button>
                    </div>

                    {/* Latency Control */}
                    <div className="space-y-4">
                        <Input
                            label={`Latência de Mock (ms): ${settings.mockLatencyMs}ms`}
                            type="range"
                            min="0"
                            max="3000"
                            step="100"
                            value={settings.mockLatencyMs}
                            onChange={handleLatencyChange}
                            icon={<Clock size={18} />}
                            className="h-2 p-0 bg-zinc-700 appearance-none cursor-pointer"
                        />
                        <p className="text-sm text-zinc-400">Simula o tempo de resposta da API para testar estados de carregamento.</p>
                    </div>

                    {/* Error Control */}
                    <div className="grid grid-cols-2 gap-6">
                        <Input
                            label={`Taxa de Erro (0.0 a 1.0): ${settings.mockErrorRate.toFixed(2)}`}
                            type="number"
                            min="0.0"
                            max="1.0"
                            step="0.1"
                            value={settings.mockErrorRate}
                            onChange={handleErrorRateChange}
                            icon={<AlertTriangle size={18} />}
                        />
                        <div>
                            <label htmlFor="errorType" className="block text-sm font-medium text-zinc-300 mb-2">
                                Tipo de Erro
                            </label>
                            <select
                                id="errorType"
                                value={settings.mockErrorType}
                                onChange={handleMockErrorTypeChange}
                                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-primary focus:border-primary transition-colors"
                            >
                                <option value="none">Nenhum Erro</option>
                                <option value="server">Erro de Servidor (500)</option>
                                <option value="credits">Erro de Créditos (402)</option>
                            </select>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <div className="pt-4 border-t border-zinc-800">
                        <Button 
                            variant="secondary" 
                            onClick={resetSettings} 
                            icon={<RefreshCw size={18} />}
                        >
                            Resetar Configurações
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};