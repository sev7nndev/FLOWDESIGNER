<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Flow Designer - SaaS de Geração de Artes com IA

Crie artes profissionais em segundos usando inteligência artificial. Sua agência de design particular.

## 🚀 Funcionalidades

- ✅ Geração de imagens com Google Gemini AI
- ✅ Sistema de autenticação completo
- ✅ Painel de Admin/Dev para gestão
- ✅ Painel do Owner com métricas
- ✅ Chat de suporte integrado
- ✅ Sistema de assinaturas e quotas
- ✅ Upload e gestão de imagens
- ✅ Interface responsiva e moderna

## 📋 Pré-requisitos

- Node.js 18+
- Conta Supabase
- Chave API do Google Gemini

## 🛠️ Configuração

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Copie `.env.local.example` para `.env.local` e preencha:
   ```env
   # Supabase
   SUPABASE_URL=sua_url_supabase
   SUPABASE_ANON_KEY=sua_chave_anon
   SUPABASE_SERVICE_KEY=sua_chave_service
   
   # Google Gemini
   GEMINI_API_KEY=sua_chave_gemini
   
   # Mercado Pago (opcional)
   MP_CLIENT_ID=seu_client_id
   MP_CLIENT_SECRET=seu_client_secret
   ```

3. **Execute o banco de dados:**
   ```bash
   # Execute as migrações SQL no Supabase
   # Use o arquivo sql/supabase_schema.sql
   ```

4. **Inicie a aplicação:**
   ```bash
   npm run dev
   ```

Isso iniciará:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📁 Estrutura do Projeto

```
├── src/                    # Frontend React
│   ├── components/         # Componentes UI
│   ├── hooks/             # Hooks customizados
│   ├── pages/             # Páginas principais
│   ├── services/          # Serviços de API
│   └── types.ts           # Tipos TypeScript
├── backend/               # Backend Node.js
│   ├── controllers/       # Controladores
│   ├── middleware/        # Middlewares
│   ├── routes/           # Rotas da API
│   └── services/         # Serviços do backend
└── sql/                  # Scripts SQL
```

## 👤 Papéis de Usuário

- **free**: 3 gerações/mês
- **starter**: 20 gerações/mês  
- **pro**: 50 gerações/mês
- **admin/dev**: Acesso ilimitado ao painel
- **owner**: Painel completo com métricas

## 🔧 Desenvolvimento

### Frontend
- React 19 + TypeScript
- Tailwind CSS
- Framer Motion
- Supabase Auth

### Backend
- Node.js + Express
- Supabase Service Role
- Google Gemini AI
- Mercado Pago SDK

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.