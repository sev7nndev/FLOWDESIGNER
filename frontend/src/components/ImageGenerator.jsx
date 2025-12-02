// frontend/src/components/ImageGenerator.jsx
import React, { useState, useRef } from 'react';
import { apiService } from '../services/apiService';
import QuotaDisplay from './QuotaDisplay';
import { Loader2, Image, AlertTriangle } from 'lucide-react';

const ImageGenerator = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quota, setQuota] = useState(null);
    const imageRef = useRef(null);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setError(null);

        if (!prompt.trim()) {
            setError('Por favor, insira um prompt para gerar a imagem.');
            return;
        }

        if (quota && !quota.isUnlimited && quota.current >= quota.limit) {
            setError('Sua quota de imagens esgotou. Faça upgrade para continuar.');
            return;
        }

        setLoading(true);
        setGeneratedImage(null);

        try {
            const result = await apiService.generateImage(prompt);
            
            // O backend retorna a URL da imagem gerada
            setGeneratedImage(result.imageUrl);
            
            // Força a atualização da quota após a geração bem-sucedida
            if (imageRef.current) {
                imageRef.current.fetchUsage();
            }

        } catch (e) {
            setError(e.message || 'Erro desconhecido ao gerar imagem.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuotaUpdate = (newQuota) => {
        setQuota(newQuota);
    };

    return (
        <div className="grid md:grid-cols-3 gap-8">
            {/* Coluna de Controle (1/3) */}
            <div className="md:col-span-1 space-y-6">
                <QuotaDisplay ref={imageRef} onQuotaUpdate={handleQuotaUpdate} />

                <div className="p-6 bg-white rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Gerar Nova Imagem</h3>
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <textarea
                            rows="4"
                            placeholder="Descreva a imagem que você quer criar (ex: 'Um dragão cyberpunk voando sobre uma cidade futurista, arte digital 8k')"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            required
                        />
                        
                        {error && (
                            <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                                <AlertTriangle size={18} className="mr-2" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (quota && !quota.isUnlimited && quota.current >= quota.limit)}
                            className="w-full py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin mr-2" />
                                    Gerando...
                                </>
                            ) : (
                                'Gerar Imagem'
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Coluna de Resultados (2/3) */}
            <div className="md:col-span-2">
                <div className="p-6 bg-white rounded-xl shadow-lg min-h-[500px] flex flex-col items-center justify-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 w-full text-left">Resultado</h3>
                    
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                            <p className="text-lg text-gray-600">A IA está desenhando sua obra-prima...</p>
                        </div>
                    )}

                    {generatedImage && !loading && (
                        <div className="w-full h-full flex flex-col items-center">
                            <img 
                                src={generatedImage} 
                                alt="Imagem Gerada por IA" 
                                className="max-w-full max-h-[450px] object-contain rounded-lg shadow-xl mb-4"
                            />
                            <a 
                                href={generatedImage} 
                                download="flow-designer-art.png"
                                className="px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition"
                            >
                                Baixar Imagem
                            </a>
                        </div>
                    )}

                    {!generatedImage && !loading && !error && (
                        <div className="text-center text-gray-400">
                            <Image size={64} className="mx-auto mb-4" />
                            <p>Sua arte aparecerá aqui após a geração.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;