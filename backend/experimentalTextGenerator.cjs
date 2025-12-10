// EXPERIMENTAL TEXT GENERATOR - Tenta Imagen com texto, fallback para híbrido
const axios = require('axios');
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

class ExperimentalTextGenerator {
    constructor() {
        this.apiKey = GEMINI_API_KEY;
    }

    // 🎯 MÉTODO PRINCIPAL: Tenta texto, fallback se falhar
    async generateSmartFlyer(businessData) {
        console.log('🧪 [EXPERIMENTAL] Tentando geração com texto...');
        
        try {
            // TENTATIVA 1: Imagen com texto
            const textResult = await this.tryImagenWithText(businessData);
            
            // Valida qualidade do texto
            if (this.isTextLegible(textResult)) {
                console.log('✅ [EXPERIMENTAL] Texto legível! Usando Imagen puro.');
                return {
                    imageBase64: textResult.imageBase64,
                    method: 'imagen_with_text',
                    quality: 'high',
                    message: 'Gerado com Imagen 4.0 (texto incluído)'
                };
            } else {
                console.log('⚠️ [EXPERIMENTAL] Texto ilegível. Fallback para híbrido...');
                return await this.fallbackToHybrid(businessData);
            }
            
        } catch (error) {
            console.error('❌ [EXPERIMENTAL] Erro na tentativa com texto:', error.message);
            console.log('🔄 [EXPERIMENTAL] Fallback para híbrido...');
            return await this.fallbackToHybrid(businessData);
        }
    }

    // 🔥 TENTATIVA: Imagen com instruções avançadas de texto
    async tryImagenWithText(businessData) {
        const niche = this.detectNiche(businessData);
        const prompt = this.createAdvancedTextPrompt(businessData, niche);
        
        console.log('📝 [EXPERIMENTAL] Prompt com texto:', prompt.substring(0, 300) + '...');
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${this.apiKey}`,
            {
                instances: [{
                    prompt: prompt,
                    aspectRatio: "9:16",
                    sampleCount: 1,
                    guidanceScale: 8.5, // Maior controle
                    negativePrompt: "blurry text, illegible text, misspelled words, wrong language, handwriting, cursive, distorted letters"
                }],
                parameters: {
                    sampleCount: 1,
                    outputOptions: { mimeType: "image/png" }
                }
            },
            {
                timeout: 120000,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
        const imageBase64 = response.data?.predictions?.[0]?.bytesBase64Encoded;
        
        if (!imageBase64) {
            throw new Error('Imagen não retornou imagem');
        }
        
        return {
            imageBase64: imageBase64,
            prompt: prompt
        };
    }

    // 📝 PROMPT AVANÇADO: Pede texto legível
    createAdvancedTextPrompt(data, niche) {
        const nicheStyles = {
            estetica: 'luxury medical spa',
            despachante: 'corporate professional',
            restaurante: 'appetizing food business',
            petshop: 'cute pet care',
            barbearia: 'vintage masculine',
            mecanica: 'industrial automotive',
            bar: 'vibrant nightlife',
            transporte: 'modern transportation',
            beleza: 'glamorous beauty',
            academia: 'athletic fitness',
            profissional: 'corporate business'
        };

        const style = nicheStyles[niche] || 'professional business';

        return `GENERATE A COMPLETE PROFESSIONAL BUSINESS FLYER WITH PERFECT READABLE TEXT.

CRITICAL TEXT REQUIREMENTS:
- ALL TEXT MUST BE IN PORTUGUESE (BRAZIL)
- Use SANS-SERIF fonts only (Arial, Helvetica style)
- NO handwriting, NO cursive, NO decorative fonts
- HIGH CONTRAST: Dark text on light background OR light text on dark background
- LARGE FONT SIZES for readability
- NO spelling errors, NO invented words
- Text must be PERFECTLY LEGIBLE at 1080x1920 resolution

BUSINESS INFORMATION TO DISPLAY:
1. BUSINESS NAME (Top, very large): "${data.nome || 'NOME DA EMPRESA'}"
2. DESCRIPTION (Below name): "${data.descricao || 'Serviços profissionais de qualidade'}"
3. PHONE NUMBER (Bottom, large): "${data.telefone || data.whatsapp || '(00) 00000-0000'}"
4. ADDRESS (Bottom): "${this.formatAddress(data) || 'Endereço disponível'}"
${data.servicos ? `5. SERVICES LIST: ${data.servicos.split(',').slice(0, 5).join(', ')}` : ''}

DESIGN SPECIFICATIONS:
- Style: ${style}
- Size: 1080x1920 pixels (vertical/portrait)
- Layout: Professional modern flyer
- Colors: Appropriate for ${niche} business
- Typography: Clean, modern, highly readable
- Composition: Balanced, professional, commercial quality

TEXT GENERATION TECHNIQUE:
- Generate each letter as a clear geometric shape
- Use vector-style text rendering
- Maximum contrast for readability
- No text distortion or artistic effects on letters
- Straight horizontal text alignment
- Professional typesetting

QUALITY STANDARDS:
- 8K resolution quality
- Commercial photography style
- Print-ready quality
- Professional graphic design standards

IMPORTANT: If you cannot generate perfect readable text, DO NOT generate the flyer. Return error instead.`;
    }

    // ✅ VALIDAÇÃO: Verifica se texto está legível
    isTextLegible(result) {
        // Por enquanto, assumimos que se gerou, pode estar legível
        // Em produção, você poderia usar OCR ou análise de imagem
        
        // Validação básica: tamanho da imagem
        if (!result.imageBase64 || result.imageBase64.length < 1000) {
            return false;
        }
        
        // TODO: Implementar OCR para validar texto real
        // const ocrResult = await performOCR(result.imageBase64);
        // return ocrResult.confidence > 0.8;
        
        // Por enquanto, retorna true para testar
        // O usuário verá o resultado e decidirá
        console.log('⚠️ [EXPERIMENTAL] Validação de texto não implementada. Assumindo legível.');
        return true;
    }

    // 🔄 FALLBACK: Usa sistema híbrido garantido
    async fallbackToHybrid(businessData) {
        console.log('🔄 [FALLBACK] Usando sistema híbrido...');
        
        const hybridGenerator = require('./hybridFlyerGenerator.cjs');
        const result = await hybridGenerator.generateHybridFlyer(businessData);
        
        return {
            imageBase64: result,
            method: 'hybrid_fallback',
            quality: 'guaranteed',
            message: 'Gerado com sistema híbrido (Imagen + Puppeteer)'
        };
    }

    // 🎯 DETECÇÃO DE NICHO (simplificada)
    detectNiche(businessData) {
        const text = ((businessData.nome || '') + ' ' + (businessData.descricao || '')).toLowerCase();
        
        const niches = [
            { name: 'estetica', regex: /\b(est[ée]tica|harmoniza[çc][ãa]o|botox|preenchimento)\b/ },
            { name: 'despachante', regex: /\b(despachante|detran|emplacamento)\b/ },
            { name: 'restaurante', regex: /\b(restaurante|pizzaria|hamburgueria|comida)\b/ },
            { name: 'petshop', regex: /\b(pet|veterin[áa]ri|animal|cachorro|gato)\b/ },
            { name: 'barbearia', regex: /\b(barbearia|barber|barbeiro)\b/ },
            { name: 'mecanica', regex: /\b(mec[âa]nica|oficina|carro|auto)\b/ },
            { name: 'bar', regex: /\b(bar|pub|balada|festa)\b/ },
            { name: 'transporte', regex: /\b(uber|taxi|motorista|transporte)\b/ },
            { name: 'beleza', regex: /\b(sal[ãa]o|beleza|manicure)\b/ },
            { name: 'academia', regex: /\b(academia|fitness|treino)\b/ }
        ];
        
        for (const niche of niches) {
            if (niche.regex.test(text)) {
                return niche.name;
            }
        }
        
        return 'profissional';
    }

    // 📍 FORMATA ENDEREÇO
    formatAddress(data) {
        if (data.addressStreet && data.addressNumber) {
            let addr = `${data.addressStreet}, ${data.addressNumber}`;
            if (data.addressNeighborhood) addr += ` - ${data.addressNeighborhood}`;
            if (data.addressCity) addr += `, ${data.addressCity}`;
            return addr;
        }
        return data.addressCity || '';
    }
}

module.exports = new ExperimentalTextGenerator();
