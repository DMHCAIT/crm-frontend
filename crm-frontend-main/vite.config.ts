import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true
    })
  ],
  mode: 'production',
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'],
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    // Improve tree-shaking
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Advanced code splitting strategy
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('axios')) {
              return 'api-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Other node_modules
            return 'vendor';
          }
          // Split large components
          if (id.includes('components/Dashboard')) {
            return 'dashboard';
          }
          if (id.includes('components/LeadsManagement')) {
            return 'leads';
          }
          if (id.includes('components/Analytics')) {
            return 'analytics';
          }
          if (id.includes('components/CommunicationsHub')) {
            return 'communications';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      format: {
        comments: false
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    __DEV__: false
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
