// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  build: {
    // Production optimizations
    // Use the default esbuild minifier to avoid requiring the optional terser dependency.
    // The drop option removes console and debugger statements in production builds.
    minify: "esbuild",
    esbuild: {
      drop: ["console", "debugger"]
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          maps: ["@googlemaps/js-api-loader"],
          supabase: ["@supabase/supabase-js"],
          stripe: ["@stripe/stripe-js"]
        }
      }
    },
    // Enable source maps for production debugging
    sourcemap: true
  },
  server: {
    // Development server configuration
    port: 3e3,
    host: true,
    cors: true
  },
  preview: {
    port: 3e3,
    host: true
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
    include: ["react", "react-dom"]
  },
  define: {
    // Replace process.env in production
    "process.env": {}
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gUHJvZHVjdGlvbiBvcHRpbWl6YXRpb25zXG4gICAgLy8gVXNlIHRoZSBkZWZhdWx0IGVzYnVpbGQgbWluaWZpZXIgdG8gYXZvaWQgcmVxdWlyaW5nIHRoZSBvcHRpb25hbCB0ZXJzZXIgZGVwZW5kZW5jeS5cbiAgICAvLyBUaGUgZHJvcCBvcHRpb24gcmVtb3ZlcyBjb25zb2xlIGFuZCBkZWJ1Z2dlciBzdGF0ZW1lbnRzIGluIHByb2R1Y3Rpb24gYnVpbGRzLlxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgIGVzYnVpbGQ6IHtcbiAgICAgIGRyb3A6IFsnY29uc29sZScsICdkZWJ1Z2dlciddLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICBtYXBzOiBbJ0Bnb29nbGVtYXBzL2pzLWFwaS1sb2FkZXInXSxcbiAgICAgICAgICBzdXBhYmFzZTogWydAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXSxcbiAgICAgICAgICBzdHJpcGU6IFsnQHN0cmlwZS9zdHJpcGUtanMnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBFbmFibGUgc291cmNlIG1hcHMgZm9yIHByb2R1Y3Rpb24gZGVidWdnaW5nXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICAvLyBEZXZlbG9wbWVudCBzZXJ2ZXIgY29uZmlndXJhdGlvblxuICAgIHBvcnQ6IDMwMDAsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBjb3JzOiB0cnVlLFxuICB9LFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICBob3N0OiB0cnVlLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICAgIGluY2x1ZGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gIH0sXG4gIGRlZmluZToge1xuICAgIC8vIFJlcGxhY2UgcHJvY2Vzcy5lbnYgaW4gcHJvZHVjdGlvblxuICAgICdwcm9jZXNzLmVudic6IHt9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBLElBSUwsUUFBUTtBQUFBLElBQ1IsU0FBUztBQUFBLE1BQ1AsTUFBTSxDQUFDLFdBQVcsVUFBVTtBQUFBLElBQzlCO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsTUFBTSxDQUFDLDJCQUEyQjtBQUFBLFVBQ2xDLFVBQVUsQ0FBQyx1QkFBdUI7QUFBQSxVQUNsQyxRQUFRLENBQUMsbUJBQW1CO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxXQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsSUFDeEIsU0FBUyxDQUFDLFNBQVMsV0FBVztBQUFBLEVBQ2hDO0FBQUEsRUFDQSxRQUFRO0FBQUE7QUFBQSxJQUVOLGVBQWUsQ0FBQztBQUFBLEVBQ2xCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
