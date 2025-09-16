// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  build: {
    // Production optimizations
    minify: "esbuild",
    esbuild: {
      drop: ["console", "debugger"]
    },
    target: "es2015",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          maps: ["@googlemaps/js-api-loader"],
          supabase: ["@supabase/supabase-js"],
          stripe: ["@stripe/stripe-js"],
          ui: ["lucide-react", "react-hot-toast"]
        }
      }
    },
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gUHJvZHVjdGlvbiBvcHRpbWl6YXRpb25zXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgZXNidWlsZDoge1xuICAgICAgZHJvcDogWydjb25zb2xlJywgJ2RlYnVnZ2VyJ10sXG4gICAgfSxcbiAgICB0YXJnZXQ6ICdlczIwMTUnLFxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICBtYXBzOiBbJ0Bnb29nbGVtYXBzL2pzLWFwaS1sb2FkZXInXSxcbiAgICAgICAgICBzdXBhYmFzZTogWydAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXSxcbiAgICAgICAgICBzdHJpcGU6IFsnQHN0cmlwZS9zdHJpcGUtanMnXSxcbiAgICAgICAgICB1aTogWydsdWNpZGUtcmVhY3QnLCAncmVhY3QtaG90LXRvYXN0J10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICAvLyBEZXZlbG9wbWVudCBzZXJ2ZXIgY29uZmlndXJhdGlvblxuICAgIHBvcnQ6IDMwMDAsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBjb3JzOiB0cnVlLFxuICB9LFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICBob3N0OiB0cnVlLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICAgIGluY2x1ZGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gIH0sXG4gIGRlZmluZToge1xuICAgIC8vIFJlcGxhY2UgcHJvY2Vzcy5lbnYgaW4gcHJvZHVjdGlvblxuICAgICdwcm9jZXNzLmVudic6IHt9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsT0FBTztBQUFBO0FBQUEsSUFFTCxRQUFRO0FBQUEsSUFDUixTQUFTO0FBQUEsTUFDUCxNQUFNLENBQUMsV0FBVyxVQUFVO0FBQUEsSUFDOUI7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLGNBQWM7QUFBQSxJQUNkLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM3QixNQUFNLENBQUMsMkJBQTJCO0FBQUEsVUFDbEMsVUFBVSxDQUFDLHVCQUF1QjtBQUFBLFVBQ2xDLFFBQVEsQ0FBQyxtQkFBbUI7QUFBQSxVQUM1QixJQUFJLENBQUMsZ0JBQWdCLGlCQUFpQjtBQUFBLFFBQ3hDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFdBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxRQUFRO0FBQUE7QUFBQSxJQUVOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxJQUN4QixTQUFTLENBQUMsU0FBUyxXQUFXO0FBQUEsRUFDaEM7QUFBQSxFQUNBLFFBQVE7QUFBQTtBQUFBLElBRU4sZUFBZSxDQUFDO0FBQUEsRUFDbEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
