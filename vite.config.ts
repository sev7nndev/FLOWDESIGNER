import path from 'path';
    import { defineConfig, loadEnv } from 'vite';
    import react from '@vitejs/plugin-react';
    import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

    export default defineConfig(({ mode }) => {
        const env = loadEnv(mode, '.', '');
        return {
          server: {
            port: 3000,
            host: '0.0.0.0',
            proxy: {
              '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
              }
            }
          },
          plugins: [dyadComponentTagger(), react()],
          define: {
            // Injeta variáveis de ambiente
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL), // Rely solely on env.SUPABASE_URL
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY), // Rely solely on env.SUPABASE_ANON_KEY
          },
          resolve: {
            alias: {
              '@': path.resolve(__dirname, '.'),
            }
          }
        };
    });