#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testando API do Flow Designer...\n');

  // Test health endpoint
  try {
    const response = await fetch(`${API_URL}/`);
    const data = await response.json();
    console.log('✅ Health check:', data.message);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test plans endpoint
  try {
    const response = await fetch(`${API_URL}/api/plans`);
    const plans = await response.json();
    console.log(`✅ Plans endpoint: ${plans.length} plans found`);
    plans.forEach(plan => {
      console.log(`   - ${plan.name}: R$${plan.price} (${plan.image_quota} imagens)`);
    });
  } catch (error) {
    console.log('❌ Plans endpoint failed:', error.message);
  }

  // Test Gemini API (if key is configured)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AIzaSyDummyKeyForTesting') {
    console.log('\n🤖 Testando Gemini API...');
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent('Test message');
      console.log('✅ Gemini API: Working correctly');
    } catch (error) {
      console.log('❌ Gemini API failed:', error.message);
    }
  } else {
    console.log('\n⚠️  Gemini API key not configured or using dummy key');
    console.log('   Configure GEMINI_API_KEY in .env.local to enable image generation');
  }

  // Test Supabase connection
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    const { data, error } = await supabase.from('plans').select('count');
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection: Working correctly');
    }
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
  }

  console.log('\n🎯 Testes concluídos!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Configure GEMINI_API_KEY com sua chave real');
  console.log('2. Execute o schema SQL no Supabase');
  console.log('3. Execute: npm run dev');
  console.log('4. Teste o app em http://localhost:5173');
}

testAPI();