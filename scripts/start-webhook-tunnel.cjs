const ngrok = require('ngrok');
const path = require('path');
const dotenv = require('dotenv');

// Load env to see if PORT is defined
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const PORT = process.env.PORT || 3005;

(async function () {
    try {
        console.log('🚀 Iniciando túnel Ngrok para testes de Webhook...');
        console.log(`📡 Conectando à porta ${PORT} do Backend...`);

        const url = await ngrok.connect({
            addr: PORT,
        });

        console.log('\n✅ TÚNEL ESTABELECIDO COM SUCESSO!\n');
        console.log('---------------------------------------------------');
        console.log(`🔗 URL PÚBLICA: ${url}`);
        console.log(`🔗 URL DO WEBHOOK: ${url}/api/webhook`);
        console.log('---------------------------------------------------');

        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('1. Copie a "URL DO WEBHOOK" acima.');
        console.log('2. Vá no Mercado Pago > Suas Integrações > Webhooks.');
        console.log('3. Cole a URL no campo "URL de produção" (Modo Sandbox).');
        console.log('4. Marque o evento "payment" (pagamento).');
        console.log('5. Faça uma compra teste no seu site.');

        console.log('\n👀 Monitorando tráfego... (Pressione Ctrl+C para encerrar)');

    } catch (err) {
        console.error('❌ Erro ao iniciar Ngrok:', err);
        console.log('Dica: Verifique se sua internet está ativa ou se o token do ngrok (opcional) é necessário.');
    }
})();
