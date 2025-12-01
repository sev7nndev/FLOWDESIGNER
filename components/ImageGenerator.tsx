import React, { useState } from 'react';
import geminiService from '../services/geminiService';

/**
 * Componente de interface para gerar imagens usando a API do Gemini.
 */
const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Por favor, insira um prompt para gerar a imagem.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const base64Image = await geminiService.generateImage(prompt);
            // Adiciona o prefixo MIME type para que o navegador possa exibir a imagem base64
            setGeneratedImage(`data:image/jpeg;base64,${base64Image}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido ao gerar imagem.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Gerador de Imagens com IA</h2>
            
            <div className="space-y-2">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                    Descreva a imagem que você quer criar:
                </label>
                <input
                    id="prompt"
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Um gato astronauta surfando em Saturno, estilo pixel art"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                />
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
            >
                {isLoading ? 'Gerando Imagem...' : 'Gerar Imagem'}
            </button>

            {error && (
                <p className="text-red-600 text-sm p-2 bg-red-50 rounded-md">
                    Erro: {error}
                </p>
            )}

            {generatedImage && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Resultado:</h3>
                    <img 
                        src={generatedImage} 
                        alt="Imagem gerada por IA" 
                        className="w-full h-auto rounded-lg shadow-lg border border-gray-200"
                    />
                </div>
            )}
        </div>
    );
};

export default ImageGenerator;