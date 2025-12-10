// TESTE MULTI-NICHO - Gera artes para todos os nichos suportados
// Usado para validar que o sistema funciona perfeitamente em TODOS os casos

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, 'test-outputs');

// Criar diretório de output se não existir
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Dados de teste para cada nicho
const TEST_CASES = [
    {
        niche: 'mecanica',
        data: {
            nome: 'Auto Center Premium',
            descricao: 'Oficina mecânica especializada em carros importados',
            whatsapp: '(11) 98765-4321',
            instagram: '@autocenterpremium',
            addressStreet: 'Av. Paulista',
            addressNumber: '1000',
            addressNeighborhood: 'Bela Vista',
            addressCity: 'São Paulo'
        }
    },
    {
        niche: 'beleza',
        data: {
            nome: 'Espaço Beleza',
            descricao: 'Salão de beleza e estética',
            whatsapp: '(11) 91234-5678',
            instagram: '@espacobeleza',
            addressCity: 'São Paulo'
        }
    },
    {
        niche: 'bar_restaurante',
        data: {
            nome: 'Bar do Gol',
            descricao: 'Bar e restaurante com jogos ao vivo',
            whatsapp: '(11) 99999-8888',
            instagram: '@bardogol',
            addressCity: 'Rio de Janeiro'
        }
    },
    {
        niche: 'despachante',
        data: {
            nome: 'Despachante Rápido',
            descricao: 'Serviços de despachante e documentação veicular',
            whatsapp: '(11) 97777-6666',
            addressCity: 'São Paulo'
        }
    },
    {
        niche: 'pizzaria',
        data: {
            nome: 'Pizzaria Bella Napoli',
            descricao: 'Pizzas artesanais no forno a lenha',
            whatsapp: '(11) 96666-5555',
            instagram: '@bellanapoli',
            addressCity: 'São Paulo'
        }
    },
    {
        niche: 'hamburgueria',
        data: {
            nome: 'Burger House',
            descricao: 'Hambúrgueres gourmet artesanais',
            whatsapp: '(11) 95555-4444',
            instagram: '@burgerhouse',
            addressCity: 'São Paulo'
        }
    },
    {
        niche: 'barbearia',
        data: {
            nome: 'Barbearia Clássica',
            descricao: 'Cortes masculinos e barba',
            whatsapp: '(11) 94444-3333',
            instagram: '@barbeariaclassica',
            addressCity: 'São Paulo'
        }
    },
    {
        niche: 'academia',
        data: {
            nome: 'Fit Power Gym',
            descricao: 'Academia de musculação e crossfit',
            whatsapp: '(11) 93333-2222',
            instagram: '@fitpowergym',
            addressCity: 'São Paulo'
        }
    },
    {
        niche: 'petshop',
        data: {
            nome: 'Pet Care',
            descricao: 'Pet shop e banho e tosa',
            whatsapp: '(11) 92222-1111',
            instagram: '@petcare',
            addressCity: 'São Paulo'
        }
    },
    {
        niche: 'festa_evento',
        data: {
            nome: 'Festa Total',
            descricao: 'Organização de festas e eventos',
            whatsapp: '(11) 91111-0000',
            instagram: '@festatotal',
            addressCity: 'São Paulo'
        }
    }
];

async function generateImageForNiche(testCase) {
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎨 Gerando arte para nicho: ${testCase.niche.toUpperCase()}`);
        console.log(`   Empresa: ${testCase.data.nome}`);
        console.log(`${'='.repeat(60)}\n`);

        const HYBRID_SYSTEM = require('../backend/advanced_prompt_system.cjs');
        const prompt = HYBRID_SYSTEM.generateBackgroundPrompt(testCase.data);

        console.log('📝 Prompt gerado (primeiras 500 chars):');
        console.log(prompt.substring(0, 500) + '...\n');

        console.log('⚡ Enviando para Imagen 4.0...');
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`,
            {
                instances: [{ prompt: prompt }],
                parameters: { sampleCount: 1, aspectRatio: "3:4" }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000 // 2 minutos
            }
        );

        const b64 = response.data?.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) {
            throw new Error('Nenhuma imagem retornada pela API');
        }

        // Salvar imagem
        const filename = `${testCase.niche}_test.png`;
        const filepath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filepath, Buffer.from(b64, 'base64'));

        console.log(`✅ Imagem salva: ${filepath}`);
        console.log(`   Tamanho: ${(Buffer.from(b64, 'base64').length / 1024).toFixed(2)} KB\n`);

        return {
            niche: testCase.niche,
            success: true,
            filepath,
            size: Buffer.from(b64, 'base64').length
        };

    } catch (error) {
        console.error(`❌ Erro ao gerar imagem para ${testCase.niche}:`);
        console.error(`   ${error.message}\n`);

        return {
            niche: testCase.niche,
            success: false,
            error: error.message
        };
    }
}

async function runMultiNicheTest() {
    console.log('\n🚀 INICIANDO TESTE MULTI-NICHO\n');
    console.log(`Total de nichos a testar: ${TEST_CASES.length}`);
    console.log(`Diretório de output: ${OUTPUT_DIR}\n`);

    const results = [];

    for (const testCase of TEST_CASES) {
        const result = await generateImageForNiche(testCase);
        results.push(result);

        // Aguardar 2 segundos entre gerações para não sobrecarregar a API
        if (testCase !== TEST_CASES[TEST_CASES.length - 1]) {
            console.log('⏳ Aguardando 2 segundos...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(60) + '\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Sucessos: ${successful.length}/${TEST_CASES.length}`);
    console.log(`❌ Falhas: ${failed.length}/${TEST_CASES.length}\n`);

    if (successful.length > 0) {
        console.log('Imagens geradas com sucesso:');
        successful.forEach(r => {
            console.log(`  ✓ ${r.niche.padEnd(20)} - ${r.filepath}`);
        });
        console.log('');
    }

    if (failed.length > 0) {
        console.log('Falhas:');
        failed.forEach(r => {
            console.log(`  ✗ ${r.niche.padEnd(20)} - ${r.error}`);
        });
        console.log('');
    }

    console.log('='.repeat(60));
    console.log('🎯 PRÓXIMO PASSO: Revisar manualmente as imagens geradas');
    console.log(`   Abrir pasta: ${OUTPUT_DIR}`);
    console.log('   Comparar com imagens de referência');
    console.log('='.repeat(60) + '\n');

    // Salvar relatório JSON
    const reportPath = path.join(OUTPUT_DIR, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        total: TEST_CASES.length,
        successful: successful.length,
        failed: failed.length,
        results: results
    }, null, 2));

    console.log(`📄 Relatório salvo em: ${reportPath}\n`);
}

// Executar teste
runMultiNicheTest().catch(console.error);
