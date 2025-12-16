/**
 * ROTA /API/GENERATE - GERAÇÃO DE ARTES COM FREEPIK MYSTIC
 * 
 * Fluxo completo:
 * 1. Detectar nicho do negócio (Gemini 2.0 Flash)
 * 2. Construir prompt estruturado com todos os dados
 * 3. Gerar arte completa com Freepik Mystic (design + texto + layout)
 * 4. Retornar base64 para o frontend
 */

const express = require('express');
const router = express.Router();
const freepikMysticService = require('../services/freepikMysticService.cjs');
const promptBuilderService = require('../services/promptBuilderService.cjs');
const nicheDetectionService = require('../services/nicheDetectionService.cjs');

router.post('/', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { form, selectedStyle } = req.body;
        
        // DEBUG: Log completo do body recebido
        console.log('\n🔍 DEBUG - Body recebido:');
        console.log(JSON.stringify(req.body, null, 2));
        
        // ═══════════════════════════════════════════════════════════════
        // VALIDAÇÃO DE DADOS
        // ═══════════════════════════════════════════════════════════════
        
        
        if (!form) {
            return res.status(400).json({
                error: "Dados do formulário não fornecidos."
            });
        }
        
        if (!form.companyName || form.companyName.trim().length < 2) {
            return res.status(400).json({
                error: "Nome da empresa é obrigatório."
            });
        }
        
        if (!form.details || form.details.trim().length < 5) {
            return res.status(400).json({
                error: "Briefing é obrigatório. Descreva o que você precisa."
            });
        }
        
        // Campos opcionais - usar valores padrão se não fornecidos
        form.phone = form.phone || 'Não informado';
        form.addressStreet = form.addressStreet || 'Endereço';
        form.addressNumber = form.addressNumber || 'S/N';
        form.addressNeighborhood = form.addressNeighborhood || 'Centro';
        form.addressCity = form.addressCity || 'São Paulo';
        
        
        console.log('\n' + '═'.repeat(70));
        console.log('🚀 INICIANDO GERAÇÃO DE ARTE COM FREEPIK MYSTIC');
        console.log('═'.repeat(70));
        console.log(`📋 Empresa: ${form.companyName}`);
        console.log(`📝 Briefing: ${form.details.substring(0, 60)}...`);
        console.log(`📱 Contato: ${form.phone}`);
        console.log(`📍 Cidade: ${form.addressCity}`);
        console.log('═'.repeat(70) + '\n');
        
        // ═══════════════════════════════════════════════════════════════
        // ETAPA 1: DETECTAR NICHO (Gemini 2.0 Flash)
        // ═══════════════════════════════════════════════════════════════
        
        console.log('🎯 ETAPA 1: Detectando nicho do negócio...');
        let niche = 'other';
        
        try {
            niche = await nicheDetectionService.detectNiche(form);
            const nicheInfo = nicheDetectionService.getNicheInfo(niche);
            console.log(`   ✅ Nicho: ${niche} (${nicheInfo.description})`);
        } catch (err) {
            console.warn(`   ⚠️ Falha ao detectar nicho: ${err.message}`);
            console.warn('   ℹ️ Usando nicho padrão "other"');
            // Não falha a requisição, apenas usa fallback
        }
        
        // ═══════════════════════════════════════════════════════════════
        // ETAPA 2: CONSTRUIR PROMPT ESTRUTURADO
        // ═══════════════════════════════════════════════════════════════
        
        console.log('\n📝 ETAPA 2: Construindo prompt estruturado...');
        const prompt = promptBuilderService.buildPrompt(form, niche, selectedStyle);
        
        console.log(`   ✅ Prompt gerado (${prompt.length} caracteres)`);
        console.log(`   📊 Estilo: ${selectedStyle?.name || 'Padrão'}`);
        console.log(`   🎨 Nicho: ${niche}`);
        
        // Log do prompt completo (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
            console.log('\n' + '─'.repeat(70));
            console.log('PROMPT COMPLETO:');
            console.log('─'.repeat(70));
            console.log(prompt);
            console.log('─'.repeat(70) + '\n');
        }
        
        // ═══════════════════════════════════════════════════════════════
        // ETAPA 3: GERAR ARTE COM FLUX + VALIDAÇÃO AUTOMÁTICA
        // ═══════════════════════════════════════════════════════════════
        
        console.log('🎨 ETAPA 3: Gerando flyer com arquitetura correta...');
        console.log('   ⏳ Normalização → Gemini → Mystic...\n');
        
        // ARQUITETURA CORRETA
        const { normalizeBusinessData } = require('../services/dataNormalizer.cjs');
        const { correctBriefingText } = require('../services/geminiTextCorrector.cjs');
        const { buildContractPrompt } = require('../services/contractPromptBuilder.cjs');
        const { detectUniversalNiche } = require('../services/universalNicheDetector.cjs');
        const freepikMysticService = require('../services/freepikMysticService.cjs');
        
        // 1. Normalizar dados
        console.log('📋 Normalizando dados...');
        const normalizedData = normalizeBusinessData(form);
        
        // 2. Detectar nicho
        console.log('🔍 Detectando nicho...');
        niche = await detectUniversalNiche(form);
        
        // 3. Gerar BLOCOS DE TEXTO com Gemini (previne pseudo-texto)
        console.log('🧠 Gerando blocos de texto com Gemini Pro...');
        const textBlocks = await correctBriefingText(normalizedData.briefing, normalizedData);
        
        // 4. Construir prompt TEXT-LOCK
        console.log('📝 Construindo prompt TEXT-LOCK...');
        const contractPrompt = buildContractPrompt(normalizedData, textBlocks, niche);
        
        console.log('\n📊 Prompt Contrato:');
        console.log('─'.repeat(70));
        console.log(contractPrompt);
        console.log('─'.repeat(70) + '\n');
        
        // 5. Gerar com Freepik Mystic
        console.log('🎨 Gerando arte com Freepik Mystic...');
        let base64 = await freepikMysticService.generateImage(contractPrompt, {
            model: "realism",
            aspectRatio: "square_1_1",
            resolution: "1k",
            guidanceScale: 9.0, // Alto controle
            negativePrompt: "amateur, low quality, blurry, text errors, wrong numbers, incorrect data, unprofessional"
        });
        
        console.log('✅ Arte gerada com sucesso!');
        
        // ═══════════════════════════════════════════════════════════════
        // ETAPA 4: RETORNAR RESULTADO
        // ═══════════════════════════════════════════════════════════════
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '═'.repeat(70));
        console.log('✅ ARTE GERADA COM SUCESSO!');
        console.log('═'.repeat(70));
        console.log(`⏱️  Tempo total: ${elapsedTime}s`);
        console.log(`📦 Tamanho: ${Math.round(base64.length / 1024)}KB`);
        console.log(`🎯 Nicho: ${niche}`);
        console.log(`🏢 Empresa: ${form.companyName}`);
        console.log('═'.repeat(70) + '\n');
        
        return res.json({ 
            base64,
            metadata: {
                niche,
                elapsedTime: parseFloat(elapsedTime),
                promptLength: prompt.length
            }
        });
        
    } catch (err) {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.error('\n' + '═'.repeat(70));
        console.error('❌ ERRO AO GERAR ARTE');
        console.error('═'.repeat(70));
        console.error(`⏱️  Tempo até erro: ${elapsedTime}s`);
        console.error(`🔴 Erro: ${err.message}`);
        console.error('═'.repeat(70));
        
        if (err.stack) {
            console.error('\nStack trace:');
            console.error(err.stack);
        }
        
        console.error('\n');
        
        // ═══════════════════════════════════════════════════════════════
        // MENSAGENS DE ERRO AMIGÁVEIS
        // ═══════════════════════════════════════════════════════════════
        
        let errorMessage = "Erro ao gerar arte. Tente novamente.";
        let statusCode = 500;
        
        // Rate limit (429)
        if (err.message?.includes('rate limit') || 
            err.message?.includes('429') || 
            err.message?.includes('Limite de uso') ||
            err.message?.includes('quota')) {
            errorMessage = "Limite de requisições atingido. Por favor, aguarde 1-2 minutos e tente novamente.";
            statusCode = 429;
            
            // Log detalhado para debug
            console.error('📊 Rate Limit Details:');
            console.error(`   - Serviço: ${err.message?.includes('Gemini') ? 'Gemini' : 'Freepik'}`);
            console.error(`   - Mensagem: ${err.message}`);
        }
        // Timeout
        else if (err.message?.includes('Timeout') || err.message?.includes('timeout')) {
            errorMessage = "A geração está demorando muito. Por favor, tente novamente com um briefing mais simples.";
            statusCode = 504;
        }
        // API Key inválida
        else if (err.message?.includes('API Key') || err.message?.includes('401')) {
            errorMessage = "Erro de configuração da API. Entre em contato com o suporte.";
            statusCode = 500;
        }
        // Payload inválido
        else if (err.message?.includes('Payload inválido') || err.message?.includes('400')) {
            errorMessage = "Dados inválidos enviados para geração. Verifique o formulário.";
            statusCode = 400;
        }
        // Gemini API (não crítico)
        else if (err.message?.includes('Gemini') || err.message?.includes('quota')) {
            errorMessage = "Erro ao processar texto, mas continuando geração...";
            // Não retorna erro, apenas loga
            console.warn('⚠️ Erro no Gemini (não crítico):', err.message);
        }
        
        return res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            elapsedTime: parseFloat(elapsedTime)
        });
    }
});

module.exports = router;