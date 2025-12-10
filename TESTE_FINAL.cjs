// TESTE FINAL: Verificar se o renderer está sendo executado
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3001';

async function testFinal() {
    console.log('🎯 === TESTE FINAL: VERIFICAÇÃO COMPLETA ===\n');

    const testData = {
        promptInfo: {
            companyName: "Beleza Premium",
            phone: "(11) 99999-9999",
            instagram: "@belezapremium",
            addressStreet: "Rua das Flores",
            addressNumber: "123",
            addressCity: "São Paulo",
            addressNeighborhood: "Jardins",
            details: "Salão de beleza especializado em tratamentos faciais e estética premium"
        }
    };

    try {
        console.log('📤 Gerando arte com dados completos...\n');

        const response = await axios.post(`${API_URL}/api/generate`, testData, {
            headers: {
                'Content-Type': 'application/json',
                'x-debug-bypass': 'secret_banana_key'
            },
            timeout: 120000
        });

        if (response.data && response.data.image) {
            const imageUrl = response.data.image.image_url;

            console.log('✅ IMAGEM GERADA COM SUCESSO!\n');
            console.log('🔗 URL:', imageUrl);
            console.log('');

            // Baixar a imagem
            console.log('📥 Baixando imagem para verificação...');
            const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imgResponse.data);

            fs.writeFileSync('./TESTE_FINAL_RESULTADO.png', buffer);
            console.log('💾 Imagem salva em: ./TESTE_FINAL_RESULTADO.png');
            console.log('');

            console.log('📊 ANÁLISE:');
            console.log(`   Tamanho do arquivo: ${(buffer.length / 1024).toFixed(2)} KB`);
            console.log('');

            console.log('🎯 PRÓXIMOS PASSOS:');
            console.log('   1. Abra o arquivo: TESTE_FINAL_RESULTADO.png');
            console.log('   2. Verifique se a imagem tem:');
            console.log('      ✅ Painel branco na parte inferior');
            console.log('      ✅ Nome da empresa: "Beleza Premium"');
            console.log('      ✅ WhatsApp: (11) 99999-9999');
            console.log('      ✅ Instagram: @belezapremium');
            console.log('      ✅ Endereço: Rua das Flores, 123 - Jardins - São Paulo');
            console.log('');
            console.log('📝 SE A IMAGEM ESTIVER SEM TEXTO:');
            console.log('   - O renderer V3 NÃO está sendo executado');
            console.log('   - Precisamos verificar os logs do backend');
            console.log('');
            console.log('📝 SE A IMAGEM TIVER O PAINEL E TEXTO:');
            console.log('   - ✅ Sistema funcionando perfeitamente!');
            console.log('   - O Nano Banana está 100% operacional');

        } else {
            console.log('❌ Resposta inesperada:', response.data);
        }

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

testFinal();
