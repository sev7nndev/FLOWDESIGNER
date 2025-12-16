/**
 * GEMINI TEXT CORRECTOR
 * Gera BLOCOS CURTOS estruturados (previne pseudo-texto visual)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configurações de retry
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 3000; // 3 segundos

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
            const is429 = error.message?.includes('429') || 
                         error.message?.includes('rate limit') ||
                         error.message?.includes('quota');
            const isLastAttempt = attempt === maxRetries;
            
            if (is429 && !isLastAttempt) {
                console.log(`⏳ Gemini rate limit. Tentativa ${attempt}/${maxRetries}. Aguardando ${delay/1000}s...`);
                await sleep(delay);
                delay *= 2; // Exponential backoff: 3s, 6s, 12s, 24s, 48s
            } else {
                throw error;
            }
        }
    }
}

async function correctBriefingText(briefing, businessData) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        const prompt = `
Você é um redator publicitário profissional no Brasil.

Tarefa:
Transformar o briefing abaixo em BLOCOS CURTOS para um flyer.

Regras obrigatórias:
- Idioma: português do Brasil
- NÃO inventar informações
- NÃO alterar números ou valores
- Cada bloco deve ter NO MÁXIMO 8 palavras
- Texto simples e direto
- Sem frases longas

Dados do cliente:
Empresa: ${businessData.companyName}
Briefing: ${briefing}

Retorne APENAS os blocos no formato:
TÍTULO: [nome da empresa]
SUBTÍTULO: [descrição curta]
DESTAQUE: [promoção ou diferencial]

Exemplo de saída:
TÍTULO: Pizzaria Bella Napoli
SUBTÍTULO: Pizza artesanal em forno a lenha
DESTAQUE: Terça-feira: compre 1 leve 2

Retorne APENAS os blocos, sem explicações.
        `.trim();
        
        // Usar retry logic para chamada do Gemini
        const result = await retryWithBackoff(async () => {
            return await model.generateContent(prompt);
        });
        
        const blocksText = result.response.text().trim();
        
        // Parsear blocos
        const blocks = parseTextBlocks(blocksText);
        
        console.log('✅ Blocos de texto gerados pelo Gemini');
        return blocks;
        
    } catch (error) {
        console.warn('⚠️ Erro ao gerar blocos com Gemini, usando fallback');
        console.warn(`   Detalhes: ${error.message}`);
        // Fallback: criar blocos manualmente
        return {
            titulo: businessData.companyName,
            subtitulo: briefing.substring(0, 50),
            destaque: ''
        };
    }
}

function parseTextBlocks(text) {
    const blocks = {
        titulo: '',
        subtitulo: '',
        destaque: ''
    };
    
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.includes('TÍTULO:')) {
            blocks.titulo = line.replace('TÍTULO:', '').trim();
        } else if (line.includes('SUBTÍTULO:')) {
            blocks.subtitulo = line.replace('SUBTÍTULO:', '').trim();
        } else if (line.includes('DESTAQUE:')) {
            blocks.destaque = line.replace('DESTAQUE:', '').trim();
        }
    }
    
    return blocks;
}

module.exports = {
    correctBriefingText
};
