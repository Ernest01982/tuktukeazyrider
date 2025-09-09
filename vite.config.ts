import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Production optimizations
    // Use the default esbuild minifier to avoid requiring the optional terser dependency.
    // The drop option removes console and debugger statements in production builds.
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          maps: ['@googlemaps/js-api-loader'],
          supabase: ['@supabase/supabase-js'],
          stripe: ['@stripe/stripe-js'],
        },
      },
    },
    // Enable source maps for production debugging
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
