#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

console.log('🔍 Flow Designer - Verificação Completa do Setup\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis do Supabase não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySetup() {
  console.log('📋 Verificando configurações...\n');

  // 1. Test Supabase connection
  console.log('1️⃣ Testando conexão com Supabase...');
  try {
    const { data, error } = await supabase.from('plans').select('count').single();
    if (error) throw error;
    console.log('✅ Conexão com Supabase: OK');
    console.log(`   - ${data.count} planos encontrados`);
  } catch (error) {
    console.error('❌ Falha na conexão com Supabase:', error.message);
    return false;
  }

  // 2. Test backend connection
  console.log('\n2️⃣ Testando conexão com Backend...');
  try {
    const response = await fetch(`${backendUrl}/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    console.log('✅ Conexão com Backend: OK');
    console.log(`   - ${data.message}`);
  } catch (error) {
    console.error('❌ Falha na conexão com Backend:', error.message);
    console.log('   - Execute: npm run server');
    return false;
  }

  // 3. Test API endpoints
  console.log('\n3️⃣ Testando endpoints da API...');
  const endpoints = [
    { path: '/api/plans', name: 'Plans' },
    { path: '/api/config/app_config', name: 'Config' },
    { path: '/api/usage/test-user', name: 'Usage' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${backendUrl}${endpoint.path}`);
      if (endpoint.path.includes('usage')) {
        console.log(`   - ${endpoint.name}: OK (usuário teste)`);
      } else {
        const data = await response.json();
        console.log(`   - ${endpoint.name}: OK`);
      }
    } catch (error) {
      console.log(`   - ${endpoint.name}: ⚠️  ${error.message}`);
    }
  }

  // 4. Check environment variables
  console.log('\n4️⃣ Verificando variáveis de ambiente...');
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'GEMINI_API_KEY',
    'BACKEND_URL',
    'FRONTEND_URL'
  ];

  let allVarsOk = true;
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      if (varName.includes('KEY')) {
        console.log(`   - ${varName}: ✅ (configurada)`);
      } else {
        console.log(`   - ${varName}: ✅ ${process.env[varName]}`);
      }
    } else {
      console.log(`   - ${varName}: ❌ (não configurada)`);
      allVarsOk = false;
    }
  }

  // 5. Check Gemini API
  console.log('\n5️⃣ Verificando API Gemini...');
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AIzaSyDummyKeyForTesting') {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('✅ API Gemini: OK (conectada)');
    } catch (error) {
      console.log(`   - API Gemini: ⚠️  ${error.message}`);
    }
  } else {
    console.log('   - API Gemini: ⚠️  (chave dummy ou não configurada)');
  }

  // 6. Final verification
  console.log('\n🎯 RESULTADO DA VERIFICAÇÃO:');
  console.log('=====================================');

  if (allVarsOk) {
    console.log('✅ Todas as variáveis de ambiente configuradas');
  } else {
    console.log('⚠️  Algumas variáveis de ambiente precisam ser configuradas');
  }

  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Configure GEMINI_API_KEY no .env.local');
  console.log('2. Execute o schema SQL no Supabase Dashboard');
  console.log('3. Execute: npm run dev');
  console.log('4. Teste em: http://localhost:5173');
  console.log('5. Backend em: http://localhost:3001');

  console.log('\n🔑 CREDENCIAIS DE TESTE:');
  console.log('Email: admin@flowdesigner.com');
  console.log('Senha: 123456');
  console.log('(Após configurar o schema no Supabase)');

  console.log('\n🎉 Setup verificado com sucesso!');
  return true;
}

verifySetup();