const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';
const BYPASS_HEADER = { 'x-bypass-auth': 'testing-secret-123' };

async function runTests() {
    console.log('🧪 Inciando Auditoria Automática...');

    // 1. Test Enhance Prompt
    try {
        console.log('\n[1/3] Testando "Melhorar com IA"...');
        const start = Date.now();
        const res = await axios.post(`${BASE_URL}/enhance-prompt`,
            { prompt: 'Pizza deliciosa' },
            { headers: { ...BYPASS_HEADER } }
        );
        const duration = Date.now() - start;
        if (res.data.enhancedPrompt && res.data.enhancedPrompt.length > 10) {
            console.log(`✅ SUCESSO! Prompt melhorado em ${duration}ms.`);
            console.log(`   Saída: "${res.data.enhancedPrompt.substring(0, 50)}..."`);
        } else {
            console.error('❌ FALHA: Resposta inválida.', res.data);
        }
    } catch (e) {
        console.error('❌ FALHA NO ENDPOINT:', e.message);
    }

    // 1.5 Register User to Ensure Admin Data
    try {
        console.log('\n[0/3] Registrando Usuário de Teste...');
        const email = `test_audit_${Date.now()}@flow.com`;
        await axios.post(`${BASE_URL}/register`, {
            email,
            password: 'password123',
            firstName: 'Audit',
            lastName: 'User'
        });
        console.log(`✅ Usuário criado: ${email}`);
    } catch (e) {
        console.log('⚠️ Aviso: Erro ao registrar (pode já existir).', e.message);
    }

    // 2. Test Admin Users (Accounting)
    try {
        console.log('\n[2/3] Testando "Contabilidade do Dono"...');
        // First, ensure we have a user with usage
        const adminRes = await axios.get(`${BASE_URL}/admin/users`, { headers: { ...BYPASS_HEADER } });

        if (adminRes.data.users && adminRes.data.users.length > 0) {
            const user = adminRes.data.users[0];
            if (user && 'images_generated' in user) {
                console.log(`✅ SUCESSO! Campo 'images_generated' encontrado.`);
                console.log(`   Usuário: ${user.email} | Geradas: ${user.images_generated}`);
            } else {
                console.error('❌ FALHA: Campo accounting ausente.', user);
            }
        } else {
            console.error('❌ FALHA: Lista de usuários vazia mesmo após registro.');
        }
    } catch (e) {
        console.error('❌ FALHA NO ADMIN:', e.message);
    }

    console.log('\n🏁 Auditoria Concluída.');
}

runTests();
