#!/bin/bash

echo "🚀 Iniciando Flow Designer em modo desenvolvimento..."

# Verificar se o arquivo .env.local existe
if [ ! -f ".env.local" ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Criando arquivo .env.local com valores padrão..."
    cat > .env.local << EOL
# Supabase Configuration
SUPABASE_URL=https://akynbiixxcftxgvjpjxu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreW5iaWl4eGNmdHhndmpwanh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjQ3MTcsImV4cCI6MjA3OTc0MDcxN30.FoIp7_p8gI_-JTuL4UU75mfyw1kjUxj0fDvtx6ZwVAI
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreW5iaWl4eGNmdHhndmpwanh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NDcxNywiZXhwIjoyMDc5NzQwNzE3fQ.C7U0yS_2x9n8J3A3J9B7D5oKxYqZ7r8M9X0wL7fQ6k

# Google AI Studio Configuration
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Mercado Pago Configuration (opcional)
MP_CLIENT_ID=your_mp_client_id
MP_CLIENT_SECRET=your_mp_client_secret
MP_REDIRECT_URI=http://localhost:3000/app/dev-panel
MP_OWNER_ID=your_owner_user_id
EOL
    echo "❗ Por favor, edite o arquivo .env.local e adicione sua GEMINI_API_KEY"
    echo "   Obtida em: https://makersuite.google.com/app/apikey"
fi

# Verificar se a GEMINI_API_KEY foi configurada
if grep -q "YOUR_GEMINI_API_KEY_HERE" .env.local; then
    echo "❌ GEMINI_API_KEY não configurada!"
    echo "   Por favor, edite .env.local e adicione sua chave da API do Google AI Studio"
    echo "   Link: https://makersuite.google.com/app/apikey"
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Iniciar o servidor
echo "🔧 Iniciando backend e frontend..."
npm run dev