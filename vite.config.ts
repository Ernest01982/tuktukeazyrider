import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Production optimizations
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    target: 'es2015',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          maps: ['@googlemaps/js-api-loader'],
          supabase: ['@supabase/supabase-js'],
          stripe: ['@stripe/stripe-js'],
          ui: ['lucide-react', 'react-hot-toast'],
        },
      },
    },
    sourcemap: true,
  },
  server: {
    // Development server configuration
    port: 3000,
    host: true,
    cors: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom'],
  },
  define: {
    // Replace process.env in production
    'process.env': {},
  },
});
