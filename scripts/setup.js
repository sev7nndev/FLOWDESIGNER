#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Flow Designer - Setup Automatizado\n');

// Check if .env.local exists
if (!fs.existsSync('.env.local')) {
  console.log('❌ Arquivo .env.local não encontrado!');
  console.log('📝️  Criando arquivo .env.local com valores padrão...');
  
  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://akynbiixxcftxgvjpjxu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreW5iaWl4eGNmdHhndmpwanh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjQ3MTcsImV4cCI6MjA3OTc0MDcxN30.FoIp7_p8gI_-JTuL4UU75mfyw1kjUxj0fDvtx6ZwVAI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreW5iaWl4eGNmdHhndmpwanh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NDcxNywiZXhwIjoyMDc5NzQwNzE3fQ.C5YhKz2J9ZQJz3YsNnLzJwXWkXqT9mYvQZJ3YsNnLzJw

# Google Gemini API
GEMINI_API_KEY=AIzaSyDummyKeyForTesting

# Mercado Pago
MP_CLIENT_ID=test_client_id
MP_CLIENT_SECRET=test_client_secret
MP_ACCESS_TOKEN=test_access_token
MP_REDIRECT_URI=http://localhost:5173/owner-panel

# Backend URLs
VITE_BACKEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=3001

# Environment
NODE_ENV=development
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('✅ .env.local criado com sucesso!');
} else {
  console.log('✅ .env.local já existe');
}

// Install dependencies
console.log('\n📦 Instalando dependências...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message);
  process.exit(1);
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('❌ node_modules não encontrado!');
  process.exit(1);
}

console.log('\n🎯 Setup concluído com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('1. Configure sua chave GEMINI_API_KEY no .env.local');
console.log('2. Execute: npm run dev');
console.log('3. Acesse: http://localhost:5173');
console.log('\n🔑 Credenciais de teste:');
console.log('Email: teste@exemplo.com');
console.log('Senha: 123456');
console.log('\n📚 Documentação: README.md');