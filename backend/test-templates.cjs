// TESTE DO SISTEMA DE TEMPLATES
// Gera flyers usando HTML/CSS ao invés de IA

const { renderFlyer, closeRenderer } = require('./templateRenderer.cjs');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'template-test-outputs');

// Criar diretório de output
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const TEST_CASES = [
    {
        niche: 'acai',
        data: {
            nome: 'Açaí do Bom',
            descricao: 'Açaí gelado e delicioso',
            whatsapp: '(11) 98765-4321',
            instagram: '@acaidobom',
            addressCity: 'São Paulo - SP'
        }
    },
    {
        niche: 'mecanica',
        data: {
            nome: 'Auto Center Premium',
            descricao: 'Oficina mecânica especializada',
            whatsapp: '(11) 91234-5678',
            addressStreet: 'Av. Paulista',
            addressNumber: '1000',
            addressNeighborhood: 'Bela Vista',
            addressCity: 'São Paulo'
        }
    },
    {
        niche: 'despachante',
        data: {
            nome: 'Despachante Rápido',
            descricao: 'Serviços de despachante e documentação',
            whatsapp: '(11) 97777-6666',
            addressCity: 'São Paulo - SP'
        }
    }
];

async function testTemplates() {
    console.log('\n🎨 TESTANDO SISTEMA DE TEMPLATES HTML/CSS\n');
    console.log(`Total de testes: ${TEST_CASES.length}`);
    console.log(`Diretório de output: ${OUTPUT_DIR}\n`);

    const results = [];

    for (const testCase of TEST_CASES) {
        try {
            console.log(`${'='.repeat(60)}`);
            console.log(`🎨 Gerando flyer: ${testCase.niche.toUpperCase()}`);
            console.log(`   Empresa: ${testCase.data.nome}`);
            console.log(`${'='.repeat(60)}\n`);

            const startTime = Date.now();

            // Renderizar template
            const imageBase64 = await renderFlyer(testCase.data);

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            // Salvar imagem
            const filename = `${testCase.niche}_template.png`;
            const filepath = path.join(OUTPUT_DIR, filename);
            fs.writeFileSync(filepath, Buffer.from(imageBase64, 'base64'));

            const size = Buffer.from(imageBase64, 'base64').length;

            console.log(`✅ Flyer gerado com sucesso!`);
            console.log(`   Arquivo: ${filepath}`);
            console.log(`   Tamanho: ${(size / 1024).toFixed(2)} KB`);
            console.log(`   Tempo: ${duration}s\n`);

            results.push({
                niche: testCase.niche,
                success: true,
                filepath,
                size,
                duration
            });

        } catch (error) {
            console.error(`❌ Erro ao gerar ${testCase.niche}:`);
            console.error(`   ${error.message}\n`);

            results.push({
                niche: testCase.niche,
                success: false,
                error: error.message
            });
        }
    }

    // Fechar browser
    await closeRenderer();

    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(60) + '\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Sucessos: ${successful.length}/${TEST_CASES.length}`);
    console.log(`❌ Falhas: ${failed.length}/${TEST_CASES.length}\n`);

    if (successful.length > 0) {
        console.log('Flyers gerados com sucesso:');
        successful.forEach(r => {
            console.log(`  ✓ ${r.niche.padEnd(15)} - ${r.duration}s - ${(r.size / 1024).toFixed(2)} KB`);
        });
        console.log('');
    }

    if (failed.length > 0) {
        console.log('Falhas:');
        failed.forEach(r => {
            console.log(`  ✗ ${r.niche.padEnd(15)} - ${r.error}`);
        });
        console.log('');
    }

    // Comparação com Imagen
    if (successful.length > 0) {
        const avgDuration = successful.reduce((sum, r) => sum + parseFloat(r.duration), 0) / successful.length;
        console.log('📈 COMPARAÇÃO COM IMAGEN:');
        console.log(`   Templates: ~${avgDuration.toFixed(2)}s por imagem`);
        console.log(`   Imagen 4.0: ~15-30s por imagem`);
        console.log(`   Velocidade: ${(20 / avgDuration).toFixed(1)}x mais rápido!`);
        console.log(`   Custo: $0.00 (vs $0.04 por imagem Imagen)\n`);
    }

    console.log('='.repeat(60));
    console.log('🎯 PRÓXIMO PASSO: Revisar flyers gerados');
    console.log(`   Abrir pasta: ${OUTPUT_DIR}`);
    console.log('='.repeat(60) + '\n');

    // Salvar relatório
    const reportPath = path.join(OUTPUT_DIR, 'template-test-report.json');
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
testTemplates().catch(console.error);
