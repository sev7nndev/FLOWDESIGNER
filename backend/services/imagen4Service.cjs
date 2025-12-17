/**
 * GOOGLE IMAGEN 4.0 ULTRA - GERAÇÃO PROFISSIONAL COM FUNDOS TEMÁTICOS
 * SISTEMA MULTI-MODELO COM FALLBACK AUTOMÁTICO PARA SAAS
 */

const axios = require('axios');
const crypto = require('crypto');
const { detectNiche, SUPPORTED_NICHES } = require('./nicheDetectionService.cjs');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Mapeamento de fundos temáticos por nicho
const NICHE_BACKGROUNDS = {
    automotive_repair: 'Professional automotive workshop background with modern tools, car parts, sleek metallic surfaces, industrial lighting, high-tech garage atmosphere',
    restaurant: 'Appetizing food photography background with elegant table setting, warm ambient lighting, culinary elements, professional kitchen atmosphere',
    beauty_salon: 'Elegant beauty salon background with soft lighting, luxurious textures, mirrors, flowers, sophisticated spa atmosphere',
    real_estate: 'Modern real estate background with city skyline, luxury buildings, professional office atmosphere, elegant architectural elements',
    gym_fitness: 'Dynamic fitness background with gym equipment, energetic atmosphere, motivational elements, athletic environment',
    vehicle_documentation: 'Professional office background with documents, official seals, organized workspace, trustworthy atmosphere',
    building_maintenance: 'Industrial maintenance background with tools, safety equipment, professional work environment',
    pet_shop: 'Friendly pet shop background with cute animals, playful elements, caring atmosphere, veterinary professional setting',
    bakery: 'Warm bakery background with fresh bread, pastries, artisanal elements, cozy atmosphere, wooden textures',
    pharmacy: 'Clean pharmaceutical background with medical elements, professional healthcare atmosphere, trustworthy setting',
    clothing_store: 'Fashionable boutique background with elegant fabrics, trendy elements, stylish atmosphere',
    technology: 'Modern tech background with digital elements, circuits, innovative atmosphere, professional IT setting',
    cleaning_services: 'Fresh cleaning background with sparkling clean surfaces, professional cleaning equipment, pristine atmosphere',
    event_planning: 'Elegant event background with decorations, celebration elements, festive professional atmosphere',
    photography: 'Artistic photography studio background with camera equipment, creative lighting, professional artistic setting',
    dentistry: 'Clean dental clinic background with professional medical equipment, trustworthy healthcare atmosphere',
    law_firm: 'Professional law office background with books, elegant furniture, authoritative prestigious atmosphere',
    accounting: 'Corporate accounting office background with organized documents, professional business atmosphere',
    construction: 'Construction site background with building materials, safety equipment, industrial professional setting',
    other: 'Clean professional background with modern elements, versatile business atmosphere'
};


class Imagen4Service {
    constructor() {
        this.apiKey = GEMINI_API_KEY;
        
        // Lista de modelos em ordem de preferência (melhor → fallback)
        this.models = [
            {
                name: 'Imagen 4.0 Ultra',
                url: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict',
                limit: '30/dia',
                quality: 'Ultra Premium'
            },
            {
                name: 'Imagen 3.0 Generate',
                url: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict',
                limit: '1500/dia',
                quality: 'Alta'
            },
            {
                name: 'Imagen 2.0 Generate',
                url: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-2.0-generate-001:predict',
                limit: '1500/dia',
                quality: 'Boa'
            }
        ];
        
        this.currentModelIndex = 0;
    }

    async buildPrompt(form) {
        const {
            companyName,
            details,
            phone,
            addressStreet,
            addressNumber,
            addressNeighborhood,
            addressCity,
            email,
            instagram,
            facebook,
            website,
            services = [],
            promotion,
            price,
            logo
        } = form;

        const sessionId = crypto.randomBytes(16).toString('hex');
        const fullAddress = `${addressStreet}, ${addressNumber} - ${addressNeighborhood}, ${addressCity}`;
        const cleanServices = [...new Set(services)].map(s => s.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim());

        // Detectar nicho automaticamente
        console.log('\n🎯 Detectando nicho do negócio...');
        const detectedNiche = await detectNiche(form);
        const nicheBackground = NICHE_BACKGROUNDS[detectedNiche] || NICHE_BACKGROUNDS.other;
        
        console.log(`✅ Nicho: ${detectedNiche} (${SUPPORTED_NICHES[detectedNiche]})`);
        console.log(`🎨 Fundo: ${nicheBackground.substring(0, 60)}...`);

        console.log('\n🎯 DADOS DO FORMULÁRIO:');
        console.log(`   SESSION: ${sessionId}`);
        console.log(`   Empresa: "${companyName}"`);
        console.log(`   WhatsApp: "${phone}"`);
        console.log(`   Email: "${email || 'N/A'}"`);
        console.log(`   Instagram: "${instagram || 'N/A'}"`);
        console.log(`   Facebook: "${facebook || 'N/A'}"`);
        console.log(`   Site: "${website || 'N/A'}"`);
        console.log(`   Endereço: "${fullAddress}"`);
        console.log(`   Serviços:`);
        cleanServices.forEach((s, i) => console.log(`      ${i + 1}. "${s}"`));
        console.log(`   Promoção: "${promotion || 'N/A'}"`);
        console.log(`   Preço: "${price || 'N/A'}"`);
        console.log(`   Logo: ${logo ? 'SIM' : 'NÃO'}"`);
        console.log(`   Briefing (contexto): "${details}"\n`);

        // PROMPT OTIMIZADO
        let prompt = `Professional vertical advertising poster (3:4) in Brazilian Portuguese.

COMPANY: ${companyName}
BACKGROUND: ${nicheBackground}
ADDRESS: ${fullAddress}
PHONE: ${phone}`;

        if (email) prompt += `\nEMAIL: ${email}`;
        if (instagram) prompt += `\nINSTAGRAM: @${instagram.replace('@', '')}`;
        if (facebook) prompt += `\nFACEBOOK: ${facebook.replace('/', '')}`;
        if (website) prompt += `\nWEBSITE: ${website}`;
        if (cleanServices.length > 0) prompt += `\nSERVICES: ${cleanServices.join(', ')}`;
        if (promotion) prompt += `\nPROMOTION: ${promotion}`;
        if (price) prompt += `\nPRICE: R$ ${price}`;

        prompt += `\n\nCreate ultra-realistic thematic background. All text in Portuguese. Professional design.`;

        return prompt.trim();
    }

    async generateBackground(form, aspectRatio = "9:16") {
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY não configurada');
        }

        console.log('\n🎨 SISTEMA MULTI-MODELO ATIVO - GARANTIA DE GERAÇÃO!');

        const maxRetries = 3;
        
        // Tentar todos os modelos disponíveis
        for (let modelIndex = 0; modelIndex < this.models.length; modelIndex++) {
            const model = this.models[modelIndex];
            console.log(`\n🔄 Tentando: ${model.name} (${model.quality}, limite: ${model.limit})`);
            
            let lastError;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const prompt = await this.buildPrompt(form);
                    
                    if (attempt === 1 && modelIndex === 0) {
                        console.log('\n📤 PROMPT:');
                        console.log('═'.repeat(70));
                        console.log(prompt);
                        console.log('═'.repeat(70) + '\n');
                    }
                    
                    if (attempt > 1) {
                        console.log(`\n🔄 Tentativa ${attempt}/${maxRetries} com ${model.name}...`);
                    }
                    
                    const response = await axios.post(
                        `${model.url}?key=${this.apiKey}`,
                        {
                            instances: [{
                                prompt: prompt,
                                aspectRatio: aspectRatio,
                                guidanceScale: 10.0
                            }],
                            parameters: {
                                sampleCount: 1,
                                imageSize: "2K",
                                outputOptions: { 
                                    mimeType: "image/png",
                                    compressionQuality: 100
                                }
                            }
                        },
                        {
                            headers: { 'Content-Type': 'application/json' },
                            timeout: 180000
                        }
                    );

                    const b64 = response.data?.predictions?.[0]?.bytesBase64Encoded;
                    
                    if (!b64) {
                        console.error('Resposta:', JSON.stringify(response.data, null, 2));
                        throw new Error('Sem imagem na resposta');
                    }

                    console.log(`✅ Gerado com ${model.name}! ${Math.round(b64.length / 1024)}KB`);
                    console.log('✅ Imagem profissional criada com sucesso\n');
                    
                    return b64;

                } catch (error) {
                    lastError = error;
                    
                    // Se for erro 429 (Rate Limit) e ainda temos tentativas neste modelo
                    if (error.response?.status === 429 && attempt < maxRetries) {
                        const delaySeconds = Math.pow(2, attempt) * 5;
                        console.log(`\n⚠️ Rate Limit (429) - Aguardando ${delaySeconds}s...`);
                        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
                        continue;
                    }
                    
                    // Se for 429 e acabaram as tentativas, tentar próximo modelo
                    if (error.response?.status === 429) {
                        console.log(`\n⚠️ ${model.name} atingiu limite. Tentando próximo modelo...`);
                        break;
                    }
                    
                    // Se for erro 404 (modelo não existe), tentar próximo
                    if (error.response?.status === 404) {
                        console.log(`\n⚠️ ${model.name} não disponível. Tentando próximo modelo...`);
                        break;
                    }
                    
                    // Outros erros
                    console.error('❌ Erro:', error.message);
                    if (error.response) {
                        console.error('Status:', error.response.status);
                    }
                    
                    break;
                }
            }
        }
        
        // Se chegou aqui, todos os modelos falharam
        throw new Error('Todos os modelos Imagen atingiram seus limites. Tente novamente mais tarde.');
    }

    fallback() {
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }
}

module.exports = new Imagen4Service();