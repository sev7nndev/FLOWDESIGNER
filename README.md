<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1A8UVm-5tINifrUBgaDIc6f7zu7tdS5N1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Crie um arquivo chamado `.env.local` na raiz do projeto e adicione as seguintes chaves. **IMPORTANTE:** As chaves para o frontend (cliente) precisam começar com o prefixo `VITE_`.

   ```
   # Chaves para o Frontend (Vite)
   VITE_SUPABASE_URL="SUA_SUPABASE_URL"
   VITE_SUPABASE_ANON_KEY="SUA_SUPABASE_ANON_KEY"
   VITE_SUPABASE_PROJECT_ID="SEU_SUPABASE_PROJECT_ID"

   # Chaves para o Backend (Node.js)
   SUPABASE_URL="SUA_SUPABASE_URL"
   SUPABASE_ANON_KEY="SUA_SUPABASE_ANON_KEY"
   SUPABASE_SERVICE_KEY="SUA_SUPABASE_SERVICE_KEY" # Chave secreta!
   GEMINI_API_KEY="SUA_GEMINI_API_KEY" # Chave secreta!
   FREEPIK_API_KEY="SUA_FREEPIK_API_KEY" # Chave secreta!
   ```
3. Run the app:
   `npm run dev`