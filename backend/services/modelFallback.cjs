/**
 * Model Fallback Chain Manager
 * Automatically switches between Gemini models when quota is exceeded
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retryWithBackoff } = require('../utils/retryWithBackoff.cjs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model priority chain (from fastest/cheapest to most capable)
const MODEL_CHAIN = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
];

class ModelFallbackManager {
    constructor() {
        this.currentModelIndex = 0;
        this.failedModels = new Set();
    }

    /**
     * Get the next available model in the fallback chain
     */
    getNextModel() {
        while (this.currentModelIndex < MODEL_CHAIN.length) {
            const model = MODEL_CHAIN[this.currentModelIndex];
            
            if (!this.failedModels.has(model)) {
                return model;
            }
            
            this.currentModelIndex++;
        }
        
        return null; // All models exhausted
    }

    /**
     * Mark a model as failed (quota exceeded)
     */
    markModelFailed(modelName) {
        this.failedModels.add(modelName);
        console.log(`❌ Modelo ${modelName} marcado como indisponível (quota excedida)`);
    }

    /**
     * Reset failed models (call this periodically or after successful requests)
     */
    reset() {
        this.failedModels.clear();
        this.currentModelIndex = 0;
    }

    /**
     * Execute a Gemini API call with automatic model fallback
     */
    async executeWithFallback(generateFn, options = {}) {
        const { maxModelAttempts = MODEL_CHAIN.length } = options;
        
        let attempts = 0;
        let lastError;

        while (attempts < maxModelAttempts) {
            const modelName = this.getNextModel();
            
            if (!modelName) {
                throw new Error('Todos os modelos Gemini esgotaram a quota. Tente novamente mais tarde.');
            }

            console.log(`🤖 Tentando com modelo: ${modelName}`);

            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                
                // Execute with retry logic
                const result = await retryWithBackoff(
                    () => generateFn(model),
                    {
                        maxRetries: 3,
                        initialDelayMs: 1000,
                        onRetry: (attempt, delay, error) => {
                            console.log(`⏳ Retry ${attempt}/3 para ${modelName} em ${delay}ms`);
                        }
                    }
                );

                // Success! Reset failed models for future requests
                this.reset();
                return { result, modelUsed: modelName };

            } catch (error) {
                lastError = error;

                // Check if it's a quota error
                const isQuotaError = 
                    error.status === 429 ||
                    error.message?.includes('quota') ||
                    error.message?.includes('rate limit');

                if (isQuotaError) {
                    this.markModelFailed(modelName);
                    this.currentModelIndex++;
                    attempts++;
                    console.log(`⚠️ Quota excedida para ${modelName}, tentando próximo modelo...`);
                    continue;
                }

                // If it's not a quota error, throw immediately
                throw error;
            }
        }

        throw lastError || new Error('Falha ao gerar com todos os modelos disponíveis');
    }
}

// Singleton instance
const fallbackManager = new ModelFallbackManager();

module.exports = { ModelFallbackManager, fallbackManager, MODEL_CHAIN };
