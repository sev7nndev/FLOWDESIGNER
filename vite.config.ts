import path from 'path';
    import { defineConfig, loadEnv } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig(({ mode }) => {
        const env = loadEnv(mode, '../', ''); // Apontando para o diretório raiz para .env.local
        return {
          server: {
            port: 5173,
            host: '0.0.0.0',
            proxy: {
              '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
              }
            }
          },
          plugins: [react()],
          define: {
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
            'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(env.VITE_SUPABASE_PROJECT_ID),
            'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY), // Nova chave
          },
          resolve: {
            alias: {
              '@': path.resolve(__dirname, '.'),
            }
          }
        };
    });