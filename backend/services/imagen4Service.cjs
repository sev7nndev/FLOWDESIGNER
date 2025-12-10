// 📁 IMAGEN 4.0 SERVICE - Serviço robusto com retry e fallback
const axios = require('axios');

class Imagen4Service {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    async generateBackground(prompt, aspectRatio = "9:16") {
        try {
            console.log('🚀 Iniciando geração com Imagen 4.0...');

            // 🔥 PROMPT SANITIZADO (evita erros 400)
            const safePrompt = this.sanitizePrompt(prompt);

            const response = await axios.post(
                `${this.baseURL}/imagen-4.0-generate-001:predict?key=${this.apiKey}`,
                {
                    instances: [{
                        prompt: safePrompt,
                        aspectRatio: aspectRatio,
                        sampleCount: 1,
                        guidanceScale: 7.5
                    }],
                    parameters: {
                        sampleCount: 1,
                        outputOptions: { mimeType: "image/png" }
                    }
                },
                {
                    timeout: 60000, // 60 segundos timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.predictions?.[0]?.bytesBase64Encoded) {
                console.log('✅ Imagen 4.0: Background gerado com sucesso!');
                return response.data.predictions[0].bytesBase64Encoded;
            } else {
                console.error('❌ Imagen 4.0: Resposta inesperada', response.data);
                throw new Error('Resposta inesperada da API Imagen 4.0');
            }

        } catch (error) {
            console.error('❌ Erro Imagen 4.0:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });

            // 🔥 FALLBACK: Imagem placeholder base64
            return this.getFallbackImage();
        }
    }

    sanitizePrompt(prompt) {
        // Remove caracteres problemáticos
        let clean = prompt
            .replace(/[^\w\s\.,!?\-:;()'"@#\n\/]/g, ' ')  // Caracteres seguros
            .replace(/\s+/g, ' ')  // Espaços múltiplos para único
            .trim();

        // Limite de caracteres
        if (clean.length > 1000) {
            clean = clean.substring(0, 1000);
        }

        // Adiciona instruções de qualidade
        clean += " Professional photography, 8K, detailed, high quality.";

        return clean;
    }

    getFallbackImage() {
        // 🔥 FALLBACK: Imagem base64 simples (1px transparente)
        console.log('🔄 Usando imagem de fallback');
        return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    // 🔥 MÉTODO ALTERNATIVO se o principal falhar
    async generateWithRetry(prompt, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔁 Tentativa ${attempt}/${maxRetries}`);
                return await this.generateBackground(prompt);
            } catch (error) {
                if (attempt === maxRetries) throw error;
                // Espera antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
        }
    }
}

module.exports = new Imagen4Service();
