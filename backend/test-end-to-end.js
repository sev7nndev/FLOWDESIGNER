/**
 * TESTE END-TO-END - Geração Completa com Freepik Mystic
 * 
 * Este script testa o fluxo completo:
 * 1. Detecção de nicho
 * 2. Construção de prompt
 * 3. Geração com Freepik Mystic
 * 4. Retorno de base64
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api/generate';

// Dados de teste (simulando formulário preenchido)
const testData = {
    form: {
        companyName: 'Calors Automóveis',
        phone: '(11) 99999-9999',
        email: 'contato@calorsauto.com.br',
        instagram: '@calorsauto',
        facebook: '/calorsauto',
        website: 'www.calorsauto.com.br',
        addressStreet: 'Rua das Flores',
        addressNumber: '123',
        addressNeighborhood: 'Centro',
        addressCity: 'São Paulo',
        details: 'Oficina especializada em carros importados. Promoção de troca de óleo com desconto de 20%. Atendimento de segunda a sábado das 8h às 18h. Mecânicos certificados.',
        logo: ''
    },
    selectedStyle: {
        id: 'modern',
        name: 'Modern'
    }
};

async function testEndToEnd() {
    console.log('\n' + '═'.repeat(70));
    console.log('🧪 TESTE END-TO-END - GERAÇÃO COMPLETA COM FREEPIK MYSTIC');
    console.log('═'.repeat(70) + '\n');
    
    console.log('📋 Dados do Teste:');
    console.log(`   Empresa: ${testData.form.companyName}`);
    console.log(`   Cidade: ${testData.form.addressCity}`);
    console.log(`   Briefing: ${testData.form.details.substring(0, 60)}...`);
    console.log(`   Estilo: ${testData.selectedStyle.name}\n`);
    
    console.log('🚀 Enviando requisição para /api/generate...\n');
    
    const startTime = Date.now();
    
    try {
        const response = await axios.post(API_URL, testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 90000 // 90 segundos timeout
        });
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '═'.repeat(70));
        console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
        console.log('═'.repeat(70));
        console.log(`⏱️  Tempo total: ${elapsedTime}s`);
        console.log(`📦 Tamanho do base64: ${Math.round(response.data.base64.length / 1024)}KB`);
        
        if (response.data.metadata) {
            console.log(`🎯 Nicho detectado: ${response.data.metadata.niche}`);
            console.log(`📝 Tamanho do prompt: ${response.data.metadata.promptLength} caracteres`);
        }
        
        // Salvar imagem gerada
        const base64Data = response.data.base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const outputPath = path.join(__dirname, 'test-outputs', `test_end_to_end_${Date.now()}.png`);
        
        // Criar diretório se não existir
        const outputDir = path.join(__dirname, 'test-outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, buffer);
        console.log(`💾 Imagem salva em: ${outputPath}`);
        
        console.log('\n' + '═'.repeat(70));
        console.log('📊 VALIDAÇÕES:');
        console.log('═'.repeat(70));
        console.log(`✅ Base64 válido: ${response.data.base64.startsWith('data:image')}`);
        console.log(`✅ Tamanho adequado: ${response.data.base64.length > 1000000} (>1MB)`);
        console.log(`✅ Metadata presente: ${!!response.data.metadata}`);
        console.log(`✅ Tempo aceitável: ${parseFloat(elapsedTime) < 60} (<60s)`);
        console.log('═'.repeat(70) + '\n');
        
        console.log('🎉 TESTE PASSOU EM TODAS AS VALIDAÇÕES!\n');
        
    } catch (error) {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '═'.repeat(70));
        console.log('❌ TESTE FALHOU');
        console.log('═'.repeat(70));
        console.log(`⏱️  Tempo até erro: ${elapsedTime}s`);
        
        if (error.response) {
            console.log(`🔴 Status: ${error.response.status}`);
            console.log(`🔴 Erro: ${error.response.data.error}`);
            if (error.response.data.details) {
                console.log(`📝 Detalhes: ${error.response.data.details}`);
            }
        } else if (error.request) {
            console.log('🔴 Erro: Sem resposta do servidor');
            console.log('📝 Verifique se o backend está rodando em http://localhost:3001');
        } else {
            console.log(`🔴 Erro: ${error.message}`);
        }
        
        console.log('═'.repeat(70) + '\n');
        
        process.exit(1);
    }
}

// Executar teste
testEndToEnd();
