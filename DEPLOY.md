# 🚀 Guia de Deploy - FLOW Designer

## Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Conta no [Mercado Pago](https://www.mercadopago.com.br/developers)
- Conta no [Resend](https://resend.com) (para emails)
- API Key do [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 📋 Passo 1: Preparar Variáveis de Ambiente

Você precisará configurar as seguintes variáveis de ambiente na Vercel:

### Supabase
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### Google AI (Gemini/Imagen)
```bash
GEMINI_API_KEY=sua_gemini_api_key_aqui
```

### Mercado Pago
```bash
MP_APP_ID=seu_app_id
MP_CLIENT_SECRET=seu_client_secret
MP_ACCESS_TOKEN=seu_access_token
MP_REDIRECT_URI=https://seu-dominio.vercel.app/owner-panel
MP_WEBHOOK_SECRET=seu_webhook_secret
MERCADO_PAGO_PUBLIC_KEY=sua_public_key
```

**Como obter o MP_WEBHOOK_SECRET:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Vá em "Webhooks"
3. Copie o "Secret" fornecido

### Resend (Email)
```bash
RESEND_API_KEY=sua_resend_api_key
FROM_EMAIL=noreply@seudominio.com
```

**Como obter a RESEND_API_KEY:**
1. Acesse: https://resend.com/api-keys
2. Crie uma nova API Key
3. Verifique seu domínio em: https://resend.com/domains

### Configurações Gerais
```bash
FRONTEND_URL=https://seu-dominio.vercel.app
NODE_ENV=production
```

---

## 🔧 Passo 2: Deploy na Vercel

### Opção A: Via GitHub (Recomendado)

1. **Faça push do código para o GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/flow-designer.git
   git push -u origin main
   ```

2. **Conecte o repositório na Vercel:**
   - Acesse: https://vercel.com/new
   - Selecione "Import Git Repository"
   - Escolha seu repositório
   - Configure as variáveis de ambiente (cole todas as variáveis acima)
   - Clique em "Deploy"

### Opção B: Via Vercel CLI

1. **Instale a Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Faça login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Configure as variáveis de ambiente:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   # ... repita para todas as variáveis
   ```

5. **Deploy para produção:**
   ```bash
   vercel --prod
   ```

---

## 🔗 Passo 3: Configurar Webhooks do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/webhooks
2. Clique em "Criar webhook"
3. Configure:
   - **URL:** `https://seu-dominio.vercel.app/api/webhook`
   - **Eventos:** Selecione "Pagamentos"
4. Salve e copie o **Secret** para a variável `MP_WEBHOOK_SECRET`

---

## 📧 Passo 4: Configurar Domínio de Email (Resend)

1. Acesse: https://resend.com/domains
2. Adicione seu domínio
3. Configure os registros DNS (MX, TXT, CNAME) conforme instruído
4. Aguarde a verificação (pode levar até 48h)
5. Atualize a variável `FROM_EMAIL` para usar seu domínio:
   ```bash
   FROM_EMAIL=noreply@seudominio.com
   ```

---

## 🗄️ Passo 5: Configurar Banco de Dados (Supabase)

### Executar Migrations

Execute os seguintes scripts SQL no Supabase SQL Editor:

1. `sql/complete_setup.sql` - Cria todas as tabelas
2. `sql/create_storage_bucket.sql` - Configura storage para logos
3. `sql/optimize_rls.sql` - Configura Row Level Security

### Criar Usuário Owner

Execute o script:
```bash
node scripts/fix_owner_clean.cjs
```

Ou manualmente no Supabase:
1. Vá em Authentication > Users
2. Crie um novo usuário com seu email
3. Execute no SQL Editor:
   ```sql
   UPDATE profiles 
   SET role = 'owner' 
   WHERE email = 'seu-email@exemplo.com';
   ```

---

## 🎨 Passo 6: Configurar Domínio Customizado (Opcional)

1. Na Vercel, vá em Settings > Domains
2. Adicione seu domínio
3. Configure os registros DNS conforme instruído:
   - **A Record:** `76.76.21.21`
   - **CNAME:** `cname.vercel-dns.com`
4. Aguarde propagação (pode levar até 48h)

---

## ✅ Passo 7: Testar o Sistema

### Teste de Registro
1. Acesse seu domínio
2. Crie uma conta de teste
3. Verifique se recebeu o email de boas-vindas

### Teste de Pagamento
1. Faça login
2. Tente fazer upgrade para um plano pago
3. Use cartão de teste do Mercado Pago:
   - **Cartão:** 5031 4332 1540 6351
   - **CVV:** 123
   - **Validade:** 11/25
4. Verifique se:
   - O pagamento foi aprovado
   - Recebeu email de confirmação
   - Sua quota foi atualizada

### Teste de Geração
1. Preencha o formulário
2. Gere uma imagem
3. Verifique se a imagem foi criada com os dados corretos

---

## 🔍 Troubleshooting

### Erro: "Supabase not configured"
- Verifique se todas as variáveis `VITE_SUPABASE_*` estão configuradas
- Certifique-se de que começam com `VITE_` (obrigatório para Vite)

### Erro: "Email not sent"
- Verifique se `RESEND_API_KEY` está configurada
- Confirme que seu domínio está verificado no Resend
- Cheque os logs da Vercel: `vercel logs`

### Erro: "Webhook signature invalid"
- Verifique se `MP_WEBHOOK_SECRET` está correto
- Confirme que a URL do webhook está correta no painel do Mercado Pago

### Erro: "AI generation failed"
- Verifique se `GEMINI_API_KEY` está configurada
- Confirme que a API Key tem permissões para Imagen
- Cheque se há quota disponível na sua conta Google AI

---

## 📊 Monitoramento

### Logs da Vercel
```bash
vercel logs --follow
```

### Logs do Supabase
Acesse: https://app.supabase.com/project/SEU_PROJETO/logs

### Analytics
Acesse: https://seu-dominio.vercel.app/admin/qa-dashboard

---

## 🔄 Atualizações Futuras

Para fazer deploy de novas versões:

```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

A Vercel fará o deploy automaticamente!

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs da Vercel
2. Verifique os logs do Supabase
3. Revise este guia
4. Entre em contato com o suporte técnico

---

**Parabéns! Seu SaaS está no ar! 🎉**
