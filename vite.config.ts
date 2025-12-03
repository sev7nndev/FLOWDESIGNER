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
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL), 
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY), 
            'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(env.SUPABASE_PROJECT_ID), 
            'import.meta.env.VITE_MP_CLIENT_ID': JSON.stringify(env.MP_CLIENT_ID), // NEW
            'import.meta.env.VITE_MP_REDIRECT_URI': JSON.stringify(env.MP_REDIRECT_URI), // NEW
          },
          resolve: {
            alias: {
              '@': path.resolve(__dirname, '.'),
            }
          },
          // Otimizações para evitar overflow
          build: {
            rollupOptions: {
              output: {
                manualChunks: {
                  vendor: ['react', 'react-dom'],
                  ui: ['framer-motion', 'lucide-react'],
                }
              }
            }
          }
        };
    });