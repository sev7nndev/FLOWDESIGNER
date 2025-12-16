/**
 * FREEPIK MYSTIC SERVICE
 * 
 * Serviço dedicado para comunicação com a API Freepik Mystic.
 * Responsável por:
 * - Iniciar geração de imagem
 * - Polling assíncrono até conclusão
 * - Retry logic com exponential backoff para rate limits
 * - Download e conversão para base64
 */

const axios = require('axios');
require('dotenv').config();

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const FREEPIK_BASE_URL = 'https://api.freepik.com/v1/ai/mystic';

// Configurações
const MAX_POLL_ATTEMPTS = 30; // 30 tentativas x 2s = 60s timeout
const POLL_INTERVAL_MS = 2000; // 2 segundos entre polls
const MAX_RETRIES = 7; // Máximo de retries para rate limits (aumentado de 5 para 7)
const INITIAL_RETRY_DELAY_MS = 5000; // Delay inicial para retry (aumentado de 2s para 5s)

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry com exponential backoff para rate limits (429)
 */
async function retryWithBackoff(fn, maxRetries = MAX_RETRIES) {
    let delay = INITIAL_RETRY_DELAY_MS;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const is429 = error.response?.status === 429;
            const isLastAttempt = attempt === maxRetries;
            
            if (is429 && !isLastAttempt) {
                console.log(`⏳ Freepik rate limit (429). Tentativa ${attempt}/${maxRetries}. Aguardando ${delay/1000}s...`);
                await sleep(delay);
                delay *= 2; // Exponential backoff: 5s, 10s, 20s, 40s, 80s, 160s, 320s
            } else {
                throw error;
            }
        }
    }
}

/**
 * Polling do status da task até completar ou falhar
 */
async function pollTaskStatus(taskId) {
    console.log(`🔄 Iniciando polling para task: ${taskId}`);
    
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
        await sleep(POLL_INTERVAL_MS);
        
        try {
            const response = await axios.get(
                `${FREEPIK_BASE_URL}/${taskId}`,
                {
                    headers: {
                        'x-freepik-api-key': FREEPIK_API_KEY,
                        'Accept': 'application/json'
                    }
                }
            );
            
            const status = response.data.data.status;
            console.log(`⏳ Polling ${i + 1}/${MAX_POLL_ATTEMPTS}: ${status}`);
            
            if (status === 'COMPLETED') {
                console.log('✅ Task completada com sucesso!');
                return response.data;
            } else if (status === 'FAILED') {
                console.error('❌ Task falhou no Freepik Mystic');
                console.error('📋 Resposta completa do Freepik:');
                console.error(JSON.stringify(response.data, null, 2));
                
                // Extrair mensagem de erro se disponível
                const errorMessage = response.data.data.error_message || 
                                   response.data.data.message || 
                                   'Freepik Mystic: Geração falhou no servidor';
                
                throw new Error(errorMessage);
            }
            // Status 'PENDING' ou 'PROCESSING' - continua polling
            
        } catch (error) {
            if (error.message.includes('Geração falhou')) {
                throw error;
            }
            // Outros erros de rede - continua tentando
            console.warn(`⚠️ Erro no polling (tentativa ${i + 1}):`, error.message);
        }
    }
    
    throw new Error(`Timeout: Freepik Mystic não completou em ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
}

/**
 * Download da imagem e conversão para base64
 */
async function downloadAndConvertToBase64(imageUrl) {
    console.log('📥 Baixando imagem gerada...');
    
    const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000 // 30s timeout para download
    });
    
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    console.log(`✅ Imagem convertida para base64 (${Math.round(base64.length / 1024)}KB)`);
    
    return dataUrl;
}

/**
 * FUNÇÃO PRINCIPAL: Gera imagem completa com Freepik Mystic
 * 
 * @param {string} prompt - Prompt estruturado completo
 * @param {object} options - Opções de geração
 * @returns {Promise<string>} - Base64 da imagem gerada
 */
async function generateImage(prompt, options = {}) {
    if (!FREEPIK_API_KEY) {
        throw new Error('FREEPIK_API_KEY não configurada no .env');
    }
    
    if (!prompt || prompt.trim().length < 10) {
        throw new Error('Prompt muito curto ou vazio');
    }
    
    // Payload para Freepik Mystic
    const payload = {
        prompt: prompt,
        model: options.model || "realism", // REALISM: melhor para texto e detalhes
        aspect_ratio: options.aspectRatio || "traditional_3_4", // 9:16 vertical
        resolution: options.resolution || "2k",
        guidance_scale: options.guidanceScale || 2.5,
        filter_nsfw: true
    };
    
    console.log('🎨 Iniciando geração com Freepik (Realism)...');
    console.log('Configurações:', {
        model: payload.model,
        aspect_ratio: payload.aspect_ratio,
        resolution: payload.resolution,
        guidance_scale: payload.guidance_scale,
        promptLength: prompt.length
    });
    
    try {
        // ETAPA 1: Iniciar geração (com retry para rate limits)
        const initResponse = await retryWithBackoff(async () => {
            return await axios.post(
                FREEPIK_BASE_URL,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-freepik-api-key': FREEPIK_API_KEY,
                        'Accept': 'application/json'
                    },
                    timeout: 10000 // 10s timeout para iniciar
                }
            );
        });
        
        const taskId = initResponse.data.data.task_id;
        
        if (!taskId) {
            throw new Error('Freepik Mystic não retornou task_id');
        }
        
        console.log(`✅ Task iniciada: ${taskId}`);
        
        // ETAPA 2: Polling até completar
        const result = await pollTaskStatus(taskId);
        
        // ETAPA 3: Download e conversão
        const imageUrl = result.data.generated?.[0];
        
        if (!imageUrl) {
            console.error('Resposta completa do Freepik:', JSON.stringify(result, null, 2));
            throw new Error('Freepik Mystic não retornou URL da imagem gerada');
        }
        
        const base64 = await downloadAndConvertToBase64(imageUrl);
        
        return base64;
        
    } catch (error) {
        console.error('❌ Erro no Freepik Mystic Service:', error.message);
        
        // Mensagens de erro amigáveis
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            if (status === 401) {
                throw new Error('API Key do Freepik inválida ou expirada');
            } else if (status === 429) {
                throw new Error('Limite de uso da API Freepik atingido. Aguarde alguns minutos.');
            } else if (status === 400) {
                throw new Error(`Freepik Mystic: Payload inválido - ${JSON.stringify(data)}`);
            } else {
                throw new Error(`Freepik Mystic: Erro ${status} - ${JSON.stringify(data)}`);
            }
        }
        
        throw error;
    }
}

// Exportar função principal
module.exports = {
    generateImage
};

// Teste standalone (executar com: node freepikMysticService.cjs)
if (require.main === module) {
    (async () => {
        console.log('🧪 TESTE DO FREEPIK MYSTIC SERVICE\n');
        
        const testPrompt = `
Create a professional advertising flyer for an automotive repair shop.

[DESIGN STYLE]
- Premium, high-tech aesthetic
- Dark background with neon accents (cyan, orange)
- Cinematic lighting, photorealistic quality

[TEXT CONTENT - USE EXACTLY AS PROVIDED]
Company Name: Calors Automóveis
Briefing: Oficina especializada em carros importados. Promoção de troca de óleo.

[CONTACT INFORMATION]
Phone: (11) 99999-9999
Address: Rua das Flores, 123 - Centro - São Paulo

[CRITICAL RULES]
- Use EXACTLY the text provided in Brazilian Portuguese
- DO NOT modify or translate any text
- Ensure ALL text is clearly legible
        `.trim();
        
        try {
            const base64 = await generateImage(testPrompt);
            console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
            console.log(`Base64 length: ${base64.length} chars`);
            console.log('Primeiros 100 chars:', base64.substring(0, 100) + '...');
        } catch (error) {
            console.error('\n❌ TESTE FALHOU:', error.message);
            process.exit(1);
        }
    })();
}
