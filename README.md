<div align="center">
<img width="1200" height="475" alt="Flow Designer Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

<h1>Flow Designer</h1>
<p>Crie artes profissionais em segundos usando inteligência artificial. Sua agência de design particular.</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

## 🚀 Funcionalidades

- ✅ **Geração de Imagens com IA** - Google Gemini AI integration
- ✅ **Sistema de Autenticação Completo** - Login, registro, Google OAuth
- ✅ **Múltiplos Painéis** - Admin, Dev, Owner e Cliente
- ✅ **Sistema de Assinaturas** - Planos Free, Starter e Pro
- ✅ **Gestão de Quotas** - Controle de uso por plano
- ✅ **Chat de Suporte Integrado** - Comunicação em tempo real
- ✅ **Upload e Gestão de Imagens** - Storage com Supabase
- ✅ **Interface Responsiva** - Mobile-first design
- ✅ **Métricas e Analytics** - Dashboard completo para owners
- ✅ **Pagamentos Integrados** - Mercado Pago

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Conta Supabase** (para banco de dados e auth)
- **Chave API Google Gemini** (para geração de imagens)

## 🛠️ Setup Rápido

### 1. Clone o Repositório
```bash
git clone https://github.com/your-username/flow-designer.git
cd flow-designer
```

### 2. Setup Automatizado
```bash
npm run setup
```
Este script irá:
- ✅ Criar arquivo `.env.local` com configurações padrão
- ✅ Instalar todas as dependências
- ✅ Preparar o ambiente de desenvolvimento

### 3. Configure as Variáveis de Ambiente
Edite o arquivo `.env.local` com suas credenciais:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Mercado Pago (opcional)
MP_CLIENT_ID=your-mp-client-id
MP_CLIENT_SECRET=your-mp-client-secret
```

### 4. Inicie a Aplicação
```bash
npm run dev
```

Acesse:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## 📁 Estrutura do Projeto

```
flow-designer/
├── src/                          # Frontend React
│   ├── components/               # Componentes UI reutilizáveis
│   │   ├── AuthScreens.tsx      # Telas de autenticação
│   │   ├── GenerationForm.tsx  # Formulário de geração
│   │   ├── ResultDisplay.tsx    # Exibição de resultados
│   │   └── ...
│   ├── hooks/                   # Hooks customizados
│   │   ├── useGeneration.ts     # Lógica de geração
│   │   ├── useAuth.ts          # Estado de autenticação
│   │   └── ...
│   ├── pages/                   # Páginas principais
│   │   ├── DevPanelPage.tsx   # Painel de desenvolvedor
│   │   ├── OwnerPanelPage.tsx  # Painel do proprietário
│   │   └── ...
│   ├── services/                # Serviços de API
│   │   ├── authService.ts      # Serviço de autenticação
│   │   ├── api.ts             # Cliente HTTP
│   │   └── ...
│   └── types.ts                # Tipos TypeScript
├── backend/                      # Backend Node.js
│   ├── controllers/             # Controladores da API
│   ├── middleware/              # Middlewares
│   ├── routes/                 # Rotas da API
│   ├── services/               # Serviços do backend
│   └── server.cjs              # Servidor Express
├── scripts/                      # Scripts utilitários
│   ├── setup.js                # Setup automatizado
│   ├── seed-data.js            # Dados de teste
│   └── deploy.sh               # Deploy para produção
└── sql/                         # Scripts SQL do banco
```

## 👤 Papéis de Usuário

| Papel | Descrição | Limite de Imagens |
|-------|------------|------------------|
| **Free** | Usuário gratuito | 3/mês |
| **Starter** | Plano básico | 20/mês |
| **Pro** | Plano avançado | 50/mês |
| **Admin** | Administrador do sistema | Ilimitado |
| **Dev** | Desenvolvedor | Ilimitado |
| **Owner** | Proprietário do SaaS | Ilimitado |

## 🔧 Scripts Disponíveis

```bash
# Instalação e configuração
npm run setup          # Setup automatizado do projeto

# Desenvolvimento
npm run dev             # Inicia frontend + backend
npm run server          # Apenas backend
npm run build           # Build para produção
npm run preview         # Preview do build

# Banco de dados
npm run seed            # Insere dados de teste

# Qualidade
npm run lint            # Verifica código ESLint
npm run lint:fix         # Corrige automaticamente
npm run type-check       # Verificação de tipos

# Deploy
npm run deploy          # Deploy para produção
```

## 🧪 Dados de Teste

Após rodar `npm run seed`, você pode usar:

**Credenciais de Teste:**
- **Admin**: `admin@flowdesigner.com`
- **Owner**: `owner@flowdesigner.com`  
- **Cliente**: `cliente@flowdesigner.com`
- **Senha para todos**: `123456`

## 🌐 Deploy

### Frontend (Vercel)
```bash
npm install -g vercel
vercel --prod
```

### Backend (Railway/Heroku)
```bash
# Configure as variáveis de ambiente no serviço
npm run build
npm start
```

### Variáveis de Produção
Crie `.env.production` com:
```env
NODE_ENV=production
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_ANON_KEY=your-production-key
GEMINI_API_KEY=your-production-gemini-key
```

## 🔐 Segurança

- ✅ **Row Level Security (RLS)** ativo no Supabase
- ✅ **Tokens JWT** para autenticação
- ✅ **Rate limiting** na API
- ✅ **CORS** configurado
- ✅ **Input sanitization** implementado
- ✅ **Environment variables** protegidas

## 📊 Monitoramento

### Logs do Backend
```bash
# Em desenvolvimento
npm run server

# Em produção
pm2 logs flow-designer
```

### Métricas do Supabase
Acesse o dashboard do Supabase para:
- 📈 Analytics de uso
- 🔍 Query performance
- 👥 User activity
- 💾 Storage usage

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para o branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: `suporte@flowdesigner.com`
- 💬 Discord: [Comunidade Flow Designer](https://discord.gg/flowdesigner)
- 📖 Docs: [Documentação Completa](https://docs.flowdesigner.com)

## 🙏 Agradecimentos

- [Supabase](https://supabase.com/) - Backend as a Service
- [Google Gemini](https://ai.google.dev/) - API de geração de imagens
- [Vercel](https://vercel.com/) - Plataforma de deploy
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

<div align="center">
  <p>Feito com ❤️ pela equipe Flow Designer</p>
  <p>⭐ Se este projeto ajudou você, deixe uma star!</p>
</div>