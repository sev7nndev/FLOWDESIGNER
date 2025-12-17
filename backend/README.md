# FLOW Backend - Render Deployment

Backend API para o SaaS FLOW - Geração de artes com IA.

## Deploy no Render

Este backend está configurado para deploy automático no Render.

### Variáveis de Ambiente Necessárias:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `FREEPIK_API_KEY`
- `MP_APP_ID`
- `MP_CLIENT_SECRET`
- `MP_ACCESS_TOKEN`
- `NODE_ENV=production`
- `PORT=10000` (Render define automaticamente)
- `FRONTEND_URL` (URL do Vercel)
- `MP_REDIRECT_URI` (URL do Vercel)

## Desenvolvimento Local

```bash
npm install
npm run dev
```

## Produção

```bash
npm start
```
