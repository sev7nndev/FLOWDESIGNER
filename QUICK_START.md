# 🚀 Flow Designer - Início Rápido

## 📋 Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com/)
- Chave API do [Google Gemini](https://makersuite.google.com/app/apikey)

## 🛠️ Setup em 5 Minutos

### 1️⃣ Configurar Supabase

1. Acesse [supabase.com](https://supabase.com/)
2. Crie um novo projeto
3. Vá para Settings > API
4. Copie a **URL** e a **Anonymous Key**
5. Vá para Settings > Database > SQL
6. Cole o conteúdo do arquivo `sql/supabase_schema.sql`
7. Execute o script

### 2️⃣ Configurar Google Gemini

1. Acesse [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Crie uma nova chave API
3. Copie a chave

### 3️⃣ Configurar Ambiente

1. Execute o setup automático:
```bash
npm run setup
```

2. Edite o arquivo `.env.local`:
```env
# Substitua com suas credenciais
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_KEY=sua_chave_service
GEMINI_API_KEY=sua_chave_gemini
```

### 4️⃣ Verificar Setup

```bash
npm run verify
```

### 5️⃣ Iniciar Aplicação

```bash
npm run dev
```

## 🌐 Acessar o App

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **API Health**: http://localhost:3001/

## 👤 Login de Teste

Após executar o schema SQL no Supabase:

- **Email**: `admin@flowdesigner.com`
- **Senha**: `123456`

## 🎯 Funcionalidades para Testar

### ✅ Como Cliente
1. Faça login com a conta de teste
2. Preencha o formulário de geração
3. Clique em "GERAR ARTE FLOW"
4. Aguarde a geração da imagem
5. Baixe o flyer gerado

### ✅ Como Admin/Dev
1. Faça login como admin
2. Acesse o painel de desenvolvimento
3. Visualize métricas e atividades
4. Gerencie imagens e usuários

### ✅ Como Owner
1. Configure o role como 'owner' no Supabase
2. Acesse o painel do proprietário
3. Visualize métricas completas
4. Configure pagamentos (Mercado Pago)

## 🔧 Comandos Úteis

```bash
# Verificar setup
npm run verify

# Inserir dados de teste
npm run seed

# Verificar API
npm run test-api

# Build para produção
npm run build

# Deploy
npm run deploy
```

## 🐛 Troubleshooting

### ❌ Frontend não inicia
```bash
# Verifique se as portas estão livres
lsof -i :5173

# Limpe o cache
npm run build -- --mode=development
```

### ❌ Backend não inicia
```bash
# Verifique se a porta 3001 está livre
lsof -i :3001

# Verifique as variáveis de ambiente
cat .env.local
```

### ❌ Erro de conexão Supabase
1. Verifique se as URLs estão corretas
2. Verifique se as chaves são válidas
3. Verifique se o RLS está configurado

### ❌ Erro na API Gemini
1. Verifique se a chave API é válida
2. Verifique se o modelo está correto
3. Verifique o limite de cota

## 📚 Documentação

- [README.md](./README.md) - Documentação completa
- [API Docs](http://localhost:3001/) - Documentação da API
- [Supabase Dashboard](https://supabase.com/dashboard) - Painel do banco

## 🆘 Suporte

- 📧 Email: suporte@flowdesigner.com
- 💬 Discord: [Comunidade](https://discord.gg/flowdesigner)
- 🐛 Issues: [GitHub](https://github.com/your-username/flow-designer/issues)

---

🎉 **Parabéns! Seu SaaS está pronto para uso!**