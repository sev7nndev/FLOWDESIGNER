#!/bin/bash

echo "🚀 Flow Designer - Deploy para Produção"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto"
    exit 1
fi

# Build frontend
echo "📦 Build do frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Falha no build do frontend"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Arquivo .env.production não encontrado!"
    echo "📝️  Criando template..."
    cat > .env.production << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-key

# Mercado Pago
MP_CLIENT_ID=your-mp-client-id
MP_CLIENT_SECRET=your-mp-client-secret

# Production URLs
VITE_BACKEND_URL=https://your-api-domain.com
BACKEND_URL=https://your-api-domain.com
FRONTEND_URL=https://your-app-domain.com

# Environment
NODE_ENV=production
PORT=3001
EOF
    echo "✅ Template .env.production criado. Configure suas variáveis!"
    exit 1
fi

# Load production environment
export $(cat .env.production | xargs)

echo "🌐 Deploy do frontend..."
# Add your frontend deployment commands here
# Example for Vercel:
# vercel --prod

# Example for Netlify:
# netlify deploy --prod --dir=dist

echo "🔧 Deploy do backend..."
# Add your backend deployment commands here
# Example for Railway:
# railway deploy

echo "✅ Deploy concluído!"
echo "🌍 Seu app está em produção!"