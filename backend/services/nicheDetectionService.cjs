/**
 * NICHE DETECTION SERVICE
 * 
 * Usa Gemini 2.0 Flash para detectar automaticamente o nicho de negócio
 * baseado no nome da empresa e briefing do cliente.
 * 
 * Isso permite otimizar o prompt para o Freepik Mystic com estilos
 * visuais específicos para cada tipo de negócio.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Nichos suportados com descrições
const SUPPORTED_NICHES = {
    automotive_repair: 'Oficina mecânica, auto center, funilaria',
    restaurant: 'Restaurante, lanchonete, hamburgueria, pizzaria',
    beauty_salon: 'Salão de beleza, barbearia, estética',
    real_estate: 'Imobiliária, corretora de imóveis',
    gym_fitness: 'Academia, personal trainer, crossfit',
    vehicle_documentation: 'Despachante, documentação veicular',
    building_maintenance: 'Manutenção predial, elétrica, hidráulica',
    pet_shop: 'Pet shop, veterinária, banho e tosa',
    bakery: 'Padaria, confeitaria, doceria',
    pharmacy: 'Farmácia, drogaria',
    clothing_store: 'Loja de roupas, boutique',
    technology: 'Assistência técnica, informática',
    cleaning_services: 'Limpeza residencial, comercial',
    event_planning: 'Organização de eventos, buffet',
    photography: 'Fotografia, estúdio fotográfico',
    dentistry: 'Clínica odontológica, dentista',
    law_firm: 'Escritório de advocacia',
    accounting: 'Contabilidade, escritório contábil',
    construction: 'Construção civil, reformas',
    other: 'Outros nichos não especificados'
};

/**
 * Detecta o nicho de negócio usando Gemini 2.0 Flash
 * 
 * @param {object} businessInfo - Informações do negócio
 * @returns {Promise<string>} - ID do nicho detectado
 */
async function detectNiche(businessInfo) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY não configurada, usando nicho "other"');
        return 'other';
    }
    
    const nicheList = Object.entries(SUPPORTED_NICHES)
        .map(([id, desc]) => `- ${id}: ${desc}`)
        .join('\n');
    
    const prompt = `
Analise os dados abaixo e identifique o NICHO de negócio mais apropriado.

DADOS DO CLIENTE:
- Nome da Empresa: ${businessInfo.companyName}
- Briefing: ${businessInfo.details}

NICHOS DISPONÍVEIS:
${nicheList}

INSTRUÇÕES:
1. Analise o nome da empresa e o briefing
2. Identifique palavras-chave que indicam o tipo de negócio
3. Escolha o nicho mais apropriado da lista acima
4. Se nenhum nicho se encaixar perfeitamente, use "other"

RESPOSTA:
Retorne APENAS o ID do nicho (ex: automotive_repair), sem explicações ou texto adicional.
    `.trim();
    
    try {
        console.log('🎯 Detectando nicho com Gemini 2.0 Flash...');
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response.text().trim().toLowerCase();
        
        // Validar se o nicho retornado existe
        const detectedNiche = SUPPORTED_NICHES[response] ? response : 'other';
        
        console.log(`✅ Nicho detectado: ${detectedNiche} (${SUPPORTED_NICHES[detectedNiche]})`);
        
        return detectedNiche;
        
    } catch (error) {
        console.error('❌ Erro ao detectar nicho:', error.message);
        console.warn('⚠️ Usando nicho padrão "other"');
        return 'other';
    }
}

/**
 * Retorna informações sobre um nicho específico
 */
function getNicheInfo(nicheId) {
    return {
        id: nicheId,
        description: SUPPORTED_NICHES[nicheId] || SUPPORTED_NICHES.other,
        exists: !!SUPPORTED_NICHES[nicheId]
    };
}

/**
 * Lista todos os nichos suportados
 */
function getAllNiches() {
    return Object.entries(SUPPORTED_NICHES).map(([id, description]) => ({
        id,
        description
    }));
}

module.exports = {
    detectNiche,
    getNicheInfo,
    getAllNiches,
    SUPPORTED_NICHES
};

// Teste standalone
if (require.main === module) {
    (async () => {
        console.log('🧪 TESTE DO NICHE DETECTION SERVICE\n');
        
        const testCases = [
            {
                companyName: 'Calors Automóveis',
                details: 'Oficina especializada em carros importados. Promoção de troca de óleo.'
            },
            {
                companyName: 'Bella Donna Salão',
                details: 'Corte, coloração e tratamentos capilares. Manicure e pedicure.'
            },
            {
                companyName: 'Pizza Express',
                details: 'Pizzaria artesanal com entrega rápida. Promoção de terça-feira.'
            },
            {
                companyName: 'TechFix Assistência',
                details: 'Conserto de celulares, notebooks e computadores.'
            }
        ];
        
        for (const testCase of testCases) {
            console.log(`\n📋 Testando: ${testCase.companyName}`);
            console.log(`   Briefing: ${testCase.details.substring(0, 50)}...`);
            
            const niche = await detectNiche(testCase);
            const info = getNicheInfo(niche);
            
            console.log(`   ✅ Resultado: ${info.id} - ${info.description}`);
        }
        
        console.log('\n✅ TESTE CONCLUÍDO!');
        
    })();
}
